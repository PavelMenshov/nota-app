import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAccessService } from '../../common/workspace-access/workspace-access.service';
import { CreateLmsIntegrationDto } from './dto/lms.dto';
import { LmsProvider } from '@prisma/client';

const BB_API_V1 = '/learn/api/public/v1';
const BB_API_V2 = '/learn/api/public/v2';
const BB_API_V3 = '/learn/api/public/v3';

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  private baseUrl(integration: { baseUrl: string }) {
    return integration.baseUrl.replace(/\/$/, '');
  }

  private async bbRequest<T>(
    baseUrl: string,
    path: string,
    accessToken: string,
    options?: { method?: string; body?: unknown },
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      method: options?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options?.body && { body: JSON.stringify(options.body) }),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Blackboard API ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async listIntegrations(userId: string) {
    return this.prisma.lmsIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        baseUrl: true,
        createdAt: true,
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntegration(userId: string, dto: CreateLmsIntegrationDto) {
    return this.prisma.lmsIntegration.create({
      data: {
        userId,
        provider: dto.provider as LmsProvider,
        baseUrl: dto.baseUrl.trim(),
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken ?? undefined,
      },
      select: {
        id: true,
        provider: true,
        baseUrl: true,
        createdAt: true,
      },
    });
  }

  async getCourses(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: true },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    // For demo: return stored courses; if none, return mock list so UI can be tested
    if (integration.courses.length > 0) {
      return integration.courses.map((c) => ({
        id: c.id,
        externalId: c.externalId,
        name: c.name,
        code: c.code,
        term: c.term,
        syncedAt: c.syncedAt.toISOString ? c.syncedAt.toISOString() : String(c.syncedAt),
      }));
    }
    // Mock courses for demo when no real LMS API is connected
    return [
      { id: 'mock-1', externalId: 'ext-1', name: 'Introduction to Computer Science', code: 'CS101', term: 'Fall 2025', syncedAt: new Date().toISOString() },
      { id: 'mock-2', externalId: 'ext-2', name: 'Data Structures', code: 'CS201', term: 'Fall 2025', syncedAt: new Date().toISOString() },
    ];
  }

  /** Returns courses with assignments (from DB or ensures mock data in DB for demo). */
  async getCoursesWithAssignments(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: { include: { assignments: true } } },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    if (integration.courses.length > 0) {
      return integration.courses.map((c) => ({
        id: c.id,
        externalId: c.externalId,
        name: c.name,
        code: c.code,
        term: c.term,
        syncedAt: c.syncedAt.toISOString?.() ?? String(c.syncedAt),
        assignments: c.assignments.map((a) => ({
          id: a.id,
          externalId: a.externalId,
          name: a.name,
          dueDate: a.dueDate?.toISOString?.() ?? null,
          points: a.points,
        })),
      }));
    }
    // Ensure mock courses and assignments exist in DB so we have real IDs for sync
    const mockCourses = [
      { externalId: 'ext-1', name: 'Introduction to Computer Science', code: 'CS101', term: 'Fall 2025', assignments: [
        { externalId: 'a1', name: 'Homework 1', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), points: 100 },
        { externalId: 'a2', name: 'Homework 2', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), points: 100 },
      ]},
      { externalId: 'ext-2', name: 'Data Structures', code: 'CS201', term: 'Fall 2025', assignments: [
        { externalId: 'a1', name: 'Project 1', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), points: 50 },
      ]},
    ];
    const created = await this.prisma.$transaction(
      mockCourses.map((mc) =>
        this.prisma.course.upsert({
          where: {
            lmsIntegrationId_externalId: { lmsIntegrationId: integrationId, externalId: mc.externalId },
          },
          create: {
            lmsIntegrationId: integrationId,
            externalId: mc.externalId,
            name: mc.name,
            code: mc.code ?? undefined,
            term: mc.term ?? undefined,
            assignments: {
              create: mc.assignments.map((a) => ({
                externalId: a.externalId,
                name: a.name,
                dueDate: a.dueDate,
                points: a.points,
              })),
            },
          },
          update: {},
          include: { assignments: true },
        }),
      ),
    );
    return created.map((c) => ({
      id: c.id,
      externalId: c.externalId,
      name: c.name,
      code: c.code,
      term: c.term,
      syncedAt: c.syncedAt.toISOString?.() ?? String(c.syncedAt),
      assignments: c.assignments.map((a) => ({
        id: a.id,
        externalId: a.externalId,
        name: a.name,
        dueDate: a.dueDate?.toISOString?.() ?? null,
        points: a.points,
      })),
    }));
  }

  /** Sync selected LMS assignments into a workspace as Tasks (with dueDate). */
  async syncAssignmentsToWorkspace(
    integrationId: string,
    userId: string,
    workspaceId: string,
    assignmentIds: string[],
  ) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: {
        courses: {
          include: { assignments: { where: { id: { in: assignmentIds } } } },
        },
      },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    await this.workspaceAccess.checkAccess(workspaceId, userId);
    const assignments = integration.courses.flatMap((c) => c.assignments);
    if (assignments.length !== assignmentIds.length) {
      throw new ForbiddenException('One or more assignment IDs are invalid or do not belong to this integration');
    }
    const created: { id: string; title: string; dueDate: string | null }[] = [];
    for (const a of assignments) {
      const task = await this.prisma.task.create({
        data: {
          workspaceId,
          creatorId: userId,
          title: a.name,
          description: a.points != null ? `LMS assignment (${a.points} pts)` : 'Imported from LMS',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: a.dueDate,
        },
      });
      created.push({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate?.toISOString?.() ?? null,
      });
    }
    return { synced: created.length, tasks: created };
  }

  /** Get grades from DB (grouped by course). Call syncGrades first to pull from LMS. */
  async getGrades(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: { include: { grades: true } } },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    return integration.courses.map((c) => ({
      id: c.id,
      externalId: c.externalId,
      name: c.name,
      code: c.code,
      term: c.term,
      grades: c.grades.map((g) => ({
        id: g.id,
        name: g.name,
        score: g.score,
        maxScore: g.maxScore,
        letterGrade: g.letterGrade,
        feedback: g.feedback,
        syncedAt: g.syncedAt.toISOString(),
      })),
    }));
  }

  /** Sync grades from LMS (Blackboard, Canvas, or Moodle) into DB. */
  async syncGrades(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: true },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    if (integration.provider === LmsProvider.BLACKBOARD) {
      return this.syncGradesBlackboard(integrationId, integration);
    }
    if (integration.provider === LmsProvider.CANVAS) {
      return this.syncGradesCanvas(integrationId, integration);
    }
    if (integration.provider === LmsProvider.MOODLE) {
      return this.syncGradesMoodle(integrationId, integration);
    }
    return { synced: 0, message: 'Grades sync not supported for this provider' };
  }

  private async syncGradesBlackboard(
    integrationId: string,
    integration: { baseUrl: string; accessToken: string; courses: { id: string; externalId: string; name: string }[] },
  ) {
    const base = this.baseUrl(integration);
    const token = integration.accessToken;

    type BbUser = { id: string };
    const me = await this.bbRequest<BbUser>(base, `${BB_API_V1}/users/me`, token);
    const bbUserId = me?.id;
    if (!bbUserId) {
      throw new Error('Could not get Blackboard user id');
    }

    const courses = integration.courses.length > 0
      ? integration.courses
      : await this.fetchBlackboardCoursesAndUpsert(integrationId, base, token);

    let totalSynced = 0;
    for (const course of courses) {
      type BbColumn = { id: string; name: string; score?: { possible?: number } };
      let columns: BbColumn[] = [];
      try {
        const colsRes = await this.bbRequest<{ results?: BbColumn[] }>(
          base,
          `${BB_API_V2}/courses/${encodeURIComponent(course.externalId)}/gradebook/columns`,
          token,
        );
        columns = colsRes?.results ?? [];
      } catch {
        continue;
      }
      for (const col of columns) {
        type BbUserGrade = { userId: string; columnId: string; status: string; score?: number; text?: string; feedback?: string };
        let usersInColumn: BbUserGrade[] = [];
        try {
          const usersRes = await this.bbRequest<{ results?: BbUserGrade[] }>(
            base,
            `${BB_API_V1}/courses/${encodeURIComponent(course.externalId)}/gradebook/columns/${encodeURIComponent(col.id)}/users`,
            token,
          );
          usersInColumn = usersRes?.results ?? [];
        } catch {
          continue;
        }
        const myGrade = usersInColumn.find((u) => u.userId === bbUserId);
        const score = myGrade?.score ?? null;
        const maxScore = col.score?.possible ?? null;
        const feedback = myGrade?.feedback ?? myGrade?.text ?? null;
        await this.prisma.grade.upsert({
          where: {
            courseId_externalColumnId: { courseId: course.id, externalColumnId: col.id },
          },
          create: {
            courseId: course.id,
            externalColumnId: col.id,
            name: col.name,
            score,
            maxScore,
            feedback,
          },
          update: { name: col.name, score, maxScore, feedback, syncedAt: new Date() },
        });
        totalSynced++;
      }
    }
    return { synced: totalSynced };
  }

  private async canvasRequest<T>(
    base: string,
    path: string,
    accessToken: string,
  ): Promise<T> {
    const pathStr = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}/api/v1${pathStr}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Canvas API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  private async syncGradesCanvas(
    integrationId: string,
    integration: { baseUrl: string; accessToken: string; courses: { id: string; externalId: string; name: string }[] },
  ) {
    const base = this.baseUrl(integration);
    const token = integration.accessToken;
    type CanvasCourse = { id: number; name: string; course_code?: string };
    type CanvasAssignment = { id: number; name: string; points_possible?: number };
    type CanvasSubmission = { assignment_id: number; score?: number; grade?: string; feedback?: string };
    let courses = integration.courses.length > 0
      ? integration.courses
      : await this.fetchCanvasCoursesAndUpsert(integrationId, base, token);
    let totalSynced = 0;
    for (const course of courses) {
      let assignments: CanvasAssignment[] = [];
      try {
        const list = await this.canvasRequest<CanvasAssignment[]>(
          base,
          `/courses/${encodeURIComponent(course.externalId)}/assignments?per_page=100`,
          token,
        );
        assignments = Array.isArray(list) ? list : [];
      } catch {
        continue;
      }
      let submissions: CanvasSubmission[] = [];
      try {
        const subList = await this.canvasRequest<CanvasSubmission[]>(
          base,
          `/courses/${encodeURIComponent(course.externalId)}/students/submissions?student_ids[]=self&per_page=100`,
          token,
        );
        submissions = Array.isArray(subList) ? subList : [];
      } catch {
        continue;
      }
      for (const sub of submissions) {
        const assignment = assignments.find((a) => a.id === sub.assignment_id);
        const name = assignment?.name ?? `Assignment ${sub.assignment_id}`;
        const score = sub.score ?? null;
        const maxScore = assignment?.points_possible ?? null;
        const letterGrade = sub.grade ?? null;
        const feedback = sub.feedback ?? null;
        await this.prisma.grade.upsert({
          where: {
            courseId_externalColumnId: { courseId: course.id, externalColumnId: String(sub.assignment_id) },
          },
          create: {
            courseId: course.id,
            externalColumnId: String(sub.assignment_id),
            name,
            score,
            maxScore,
            letterGrade,
            feedback,
          },
          update: { name, score, maxScore, letterGrade, feedback, syncedAt: new Date() },
        });
        totalSynced++;
      }
    }
    return { synced: totalSynced };
  }

  private async fetchCanvasCoursesAndUpsert(
    integrationId: string,
    base: string,
    token: string,
  ): Promise<{ id: string; externalId: string; name: string }[]> {
    type CanvasCourse = { id: number; name: string; course_code?: string };
    const list = await this.canvasRequest<CanvasCourse[]>(
      base,
      '/courses?enrollment_state=active&per_page=50',
      token,
    );
    const results = Array.isArray(list) ? list : [];
    const created = await this.prisma.$transaction(
      results.map((c) =>
        this.prisma.course.upsert({
          where: {
            lmsIntegrationId_externalId: { lmsIntegrationId: integrationId, externalId: String(c.id) },
          },
          create: {
            lmsIntegrationId: integrationId,
            externalId: String(c.id),
            name: c.name,
            code: c.course_code ?? undefined,
          },
          update: { name: c.name, code: c.course_code ?? undefined, syncedAt: new Date() },
        }),
      ),
    );
    return created;
  }

  private async moodleRequest<T>(
    base: string,
    wsfunction: string,
    token: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    const url = new URL(base.endsWith('/server.php') ? base : `${base.replace(/\/$/, '')}/webservice/rest/server.php`);
    url.searchParams.set('wstoken', token);
    url.searchParams.set('wsfunction', wsfunction);
    url.searchParams.set('moodlewsrestformat', 'json');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Moodle API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (data?.exception) throw new Error(data.message || data.exception);
    return data as T;
  }

  private async syncGradesMoodle(
    integrationId: string,
    integration: { baseUrl: string; accessToken: string; courses: { id: string; externalId: string; name: string }[] },
  ) {
    const base = this.baseUrl(integration);
    const token = integration.accessToken;
    type MoodleSiteInfo = { userid?: number };
    let userId: number;
    try {
      const info = await this.moodleRequest<MoodleSiteInfo>(base, 'core_webservice_get_site_info', token);
      userId = info?.userid ?? 0;
    } catch {
      return { synced: 0, message: 'Could not get Moodle user id' };
    }
    if (!userId) return { synced: 0, message: 'Moodle user id not available' };
    let courses = integration.courses.length > 0
      ? integration.courses
      : await this.fetchMoodleCoursesAndUpsert(integrationId, base, token, userId);
    let totalSynced = 0;
    type MoodleGradeItem = { id: number; itemname: string; graderaw?: number; gradeformatted?: string; grademin?: number; grademax?: number; feedback?: string };
    type MoodleGradeResponse = { usergrades?: { gradeitems?: MoodleGradeItem[] }[] };
    for (const course of courses) {
      try {
        const data = await this.moodleRequest<MoodleGradeResponse>(base, 'gradereport_user_get_grade_items', token, {
          courseid: course.externalId,
          userid: userId,
        });
        const userGrades = data?.usergrades?.[0];
        const items = userGrades?.gradeitems ?? [];
        for (const item of items) {
          const raw = item.graderaw != null ? Number(item.graderaw) : (typeof item.gradeformatted === 'string' ? Number.parseFloat(item.gradeformatted) : Number.NaN);
          const scoreVal = Number.isFinite(raw) ? raw : null;
          const maxScore = item.grademax != null ? Number(item.grademax) : null;
          await this.prisma.grade.upsert({
            where: {
              courseId_externalColumnId: { courseId: course.id, externalColumnId: String(item.id) },
            },
            create: {
              courseId: course.id,
              externalColumnId: String(item.id),
              name: item.itemname || `Item ${item.id}`,
              score: scoreVal,
              maxScore,
              feedback: item.feedback ?? undefined,
            },
            update: { name: item.itemname || `Item ${item.id}`, score: scoreVal, maxScore, feedback: item.feedback ?? undefined, syncedAt: new Date() },
          });
          totalSynced++;
        }
      } catch {
        continue;
      }
    }
    return { synced: totalSynced };
  }

  private async fetchMoodleCoursesAndUpsert(
    integrationId: string,
    base: string,
    token: string,
    userId: number,
  ): Promise<{ id: string; externalId: string; name: string }[]> {
    type MoodleCourse = { id: number; fullname: string; shortname?: string };
    type MoodleEnrolled = { id: number; fullname: string; shortname?: string }[];
    let list: MoodleCourse[] = [];
    try {
      list = await this.moodleRequest<MoodleEnrolled>(base, 'core_enrol_get_users_courses', token, { userid: userId });
    } catch {
      return [];
    }
    const courses = Array.isArray(list) ? list : [];
    const created = await this.prisma.$transaction(
      courses.map((c) =>
        this.prisma.course.upsert({
          where: {
            lmsIntegrationId_externalId: { lmsIntegrationId: integrationId, externalId: String(c.id) },
          },
          create: {
            lmsIntegrationId: integrationId,
            externalId: String(c.id),
            name: c.fullname,
            code: c.shortname ?? undefined,
          },
          update: { name: c.fullname, code: c.shortname ?? undefined, syncedAt: new Date() },
        }),
      ),
    );
    return created;
  }

  private async fetchBlackboardCoursesAndUpsert(
    integrationId: string,
    base: string,
    token: string,
  ): Promise<{ id: string; externalId: string; name: string }[]> {
    type BbCourse = { id: string; name: string; courseId?: string };
    const res = await this.bbRequest<{ results?: BbCourse[] }>(
      base,
      `${BB_API_V3}/courses?limit=50`,
      token,
    );
    const results = res?.results ?? [];
    const created = await this.prisma.$transaction(
      results.map((c) =>
        this.prisma.course.upsert({
          where: {
            lmsIntegrationId_externalId: { lmsIntegrationId: integrationId, externalId: c.id },
          },
          create: {
            lmsIntegrationId: integrationId,
            externalId: c.id,
            name: c.name,
          },
          update: { name: c.name, syncedAt: new Date() },
        }),
      ),
    );
    return created;
  }

  /** Get announcements from DB. Call syncAnnouncements first to pull from LMS. */
  async getAnnouncements(integrationId: string, userId: string, limit = 50) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: {
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { course: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    return integration.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
      course: a.course ? { id: a.course.id, name: a.course.name, code: a.course.code } : null,
    }));
  }

  /** Sync announcements from Blackboard (course contents). No-op for non-Blackboard or if endpoint not available. */
  async syncAnnouncements(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: true },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    if (integration.provider !== LmsProvider.BLACKBOARD) {
      return { synced: 0, message: 'Announcements sync is supported for Blackboard only' };
    }
    const base = this.baseUrl(integration);
    const token = integration.accessToken;
    const courses = integration.courses.length > 0 ? integration.courses : await this.fetchBlackboardCoursesAndUpsert(integrationId, base, token);
    let totalSynced = 0;
    for (const course of courses) {
      type BbContent = { id: string; title: string; body?: string; created: string; contentHandler?: { id: string } };
      try {
        const res = await this.bbRequest<{ results?: BbContent[] }>(
          base,
          `${BB_API_V1}/courses/${encodeURIComponent(course.externalId)}/contents?expand=body`,
          token,
        );
        const contents = res?.results ?? [];
        const announcements = contents.filter(
          (c) => c.contentHandler?.id === 'resource/x-bb-announcement' || (c.title && (c.body != null || c.created)),
        );
        for (const ann of announcements.slice(0, 30)) {
          await this.prisma.lmsAnnouncement.upsert({
            where: {
              lmsIntegrationId_externalId: { lmsIntegrationId: integrationId, externalId: ann.id },
            },
            create: {
              lmsIntegrationId: integrationId,
              courseId: course.id,
              externalId: ann.id,
              title: ann.title,
              body: ann.body ?? undefined,
              createdAt: ann.created ? new Date(ann.created) : new Date(),
            },
            update: { title: ann.title, body: ann.body ?? undefined, syncedAt: new Date() },
          });
          totalSynced++;
        }
      } catch {
        // Course contents or announcements may not be available
      }
    }
    return { synced: totalSynced };
  }
}
