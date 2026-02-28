import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceAccessService } from './workspace-access.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkspaceAccessService', () => {
  let service: WorkspaceAccessService;
  let prisma: { workspaceMember: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceAccessService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();
    service = module.get(WorkspaceAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return member when user has access', async () => {
    const workspaceId = 'ws1';
    const userId = 'user1';
    prisma.workspaceMember.findUnique.mockResolvedValue({
      workspaceId,
      userId,
      role: 'EDITOR',
    });
    const result = await service.checkAccess(workspaceId, userId);
    expect(result).toEqual({ workspaceId, userId, role: 'EDITOR' });
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  });

  it('should allow when role is in allowedRoles', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'ws1',
      userId: 'user1',
      role: 'VIEWER',
    });
    const result = await service.checkAccess('ws1', 'user1', ['OWNER', 'VIEWER']);
    expect(result.role).toBe('VIEWER');
  });

  it('should throw ForbiddenException when member not found', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(null);
    await expect(service.checkAccess('ws1', 'user1')).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.checkAccess('ws1', 'user1')).rejects.toThrow(
      'Access denied',
    );
  });

  it('should throw ForbiddenException when role not in allowedRoles', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'ws1',
      userId: 'user1',
      role: 'VIEWER',
    });
    await expect(
      service.checkAccess('ws1', 'user1', ['OWNER', 'EDITOR']),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.checkAccess('ws1', 'user1', ['OWNER', 'EDITOR']),
    ).rejects.toThrow('Insufficient permissions');
  });
});
