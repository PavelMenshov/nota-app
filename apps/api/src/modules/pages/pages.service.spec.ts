import { Test, TestingModule } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAccessService } from '../../common/workspace-access/workspace-access.service';

describe('PagesService', () => {
  let service: PagesService;
  let prisma: {
    page: { aggregate: jest.Mock; create: jest.Mock };
    activity: { create: jest.Mock };
  };
  let workspaceAccess: { checkAccess: jest.Mock };

  beforeEach(async () => {
    prisma = {
      page: {
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
        create: jest.fn(),
      },
      activity: { create: jest.fn().mockResolvedValue({}) },
    };
    workspaceAccess = { checkAccess: jest.fn().mockResolvedValue({}) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspaceAccessService, useValue: workspaceAccess },
      ],
    }).compile();
    service = module.get(PagesService);
  });

  describe('create', () => {
    const workspaceId = 'ws1';
    const userId = 'user1';

    it('should create a page with doc and canvas when isFolder is false', async () => {
      const dto = {
        workspaceId,
        title: 'My Page',
        parentId: undefined,
      };
      const created = {
        id: 'page1',
        title: dto.title,
        workspaceId,
        parentId: null,
        doc: { id: 'doc1', content: {}, plainText: '' },
        canvas: { id: 'canvas1', content: {} },
      };
      prisma.page.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);

      expect(workspaceAccess.checkAccess).toHaveBeenCalledWith(
        workspaceId,
        userId,
        ['OWNER', 'EDITOR'],
      );
      expect(prisma.page.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId,
            title: dto.title,
            doc: { create: expect.any(Object) },
            canvas: { create: expect.any(Object) },
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('should create a folder without doc and canvas when isFolder is true', async () => {
      const dto = {
        workspaceId,
        title: 'My Folder',
        parentId: undefined,
        isFolder: true,
      };
      const created = {
        id: 'page2',
        title: dto.title,
        workspaceId,
        parentId: null,
        doc: null,
        canvas: null,
      };
      prisma.page.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);

      expect(workspaceAccess.checkAccess).toHaveBeenCalledWith(
        workspaceId,
        userId,
        ['OWNER', 'EDITOR'],
      );
      const createCall = prisma.page.create.mock.calls[0][0];
      expect(createCall.data).not.toHaveProperty('doc');
      expect(createCall.data).not.toHaveProperty('canvas');
      expect(createCall.data.workspaceId).toBe(workspaceId);
      expect(createCall.data.title).toBe(dto.title);
      expect(result).toEqual(created);
    });

    it('should set order to max+1', async () => {
      prisma.page.aggregate.mockResolvedValue({ _max: { order: 5 } });
      prisma.page.create.mockResolvedValue({
        id: 'p1',
        title: 'T',
        order: 6,
      });
      await service.create(userId, {
        workspaceId,
        title: 'T',
      });
      expect(prisma.page.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 6 }),
        }),
      );
    });
  });
});
