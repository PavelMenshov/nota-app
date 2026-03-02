import { z } from 'zod';

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

// Workspace validation
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional().nullable(),
});

// Page validation
export const createPageSchema = z.object({
  workspaceId: z.string().cuid(),
  title: z.string().min(1, 'Title is required').max(200),
  parentId: z.string().cuid().optional().nullable(),
  isFolder: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(50).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

// Doc validation
export const updateDocSchema = z.object({
  content: z.unknown(),
  plainText: z.string().optional(),
});

// Canvas validation
export const updateCanvasSchema = z.object({
  content: z.unknown(),
});

// Task validation
export const createTaskSchema = z.object({
  workspaceId: z.string().cuid(),
  pageId: z.string().cuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  pageId: z.string().cuid().optional().nullable(),
});

// Calendar validation
export const createEventSchema = z.object({
  workspaceId: z.string().cuid(),
  pageId: z.string().cuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
  meetingUrl: z.string().max(2000).optional().or(z.literal('')),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
  pageId: z.string().cuid().optional().nullable(),
  meetingUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
});

// Comment validation
export const createCommentSchema = z.object({
  docId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  position: z.unknown().optional(),
  parentId: z.string().cuid().optional().nullable(),
});

// PDF Annotation validation
export const createAnnotationSchema = z.object({
  sourceId: z.string().cuid(),
  type: z.enum(['HIGHLIGHT', 'NOTE', 'DRAWING', 'TEXT']),
  content: z.string().max(5000).optional(),
  color: z.string().max(20).optional(),
  pageNumber: z.number().int().positive(),
  position: z.unknown(),
  selectedText: z.string().max(10000).optional(),
});

// Export validation
export const createExportJobSchema = z.object({
  type: z.enum(['PDF', 'DOCX', 'MARKDOWN']),
  config: z.object({
    pageIds: z.array(z.string().cuid()).optional(),
    workspaceId: z.string().cuid().optional(),
    includeAnnotations: z.boolean().optional(),
    includeCoverImage: z.boolean().optional(),
  }),
});

// AI validation
export const aiSummarySchema = z.object({
  pageId: z.string().cuid(),
  includeDoc: z.boolean().optional().default(true),
  includeSources: z.boolean().optional().default(true),
  maxLength: z.number().int().positive().max(5000).optional(),
});

export const aiFlashcardsSchema = z.object({
  pageId: z.string().cuid(),
  count: z.number().int().positive().max(50).optional().default(10),
  title: z.string().min(1).max(100).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type UpdateDocInput = z.infer<typeof updateDocSchema>;
export type UpdateCanvasInput = z.infer<typeof updateCanvasSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type CreateExportJobInput = z.infer<typeof createExportJobSchema>;
export type AISummaryInput = z.infer<typeof aiSummarySchema>;
export type AIFlashcardsInput = z.infer<typeof aiFlashcardsSchema>;
