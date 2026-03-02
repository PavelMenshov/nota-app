import { z } from 'zod';

/** A single custom link with URL and user-defined label */
export const customLinkSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(200),
});

export const libraryPresetSchema = z.enum(['google', 'none']);
export const classroomPresetSchema = z.enum(['google', 'teams', 'none']);

export const libraryLinksSchema = z.object({
  preset: libraryPresetSchema.optional(),
  custom: z.array(customLinkSchema).optional(),
});
export const classroomLinksSchema = z.object({
  preset: classroomPresetSchema.optional(),
  custom: z.array(customLinkSchema).optional(),
});

export const quickLinksSchema = z.object({
  library: libraryLinksSchema.optional(),
  classroom: classroomLinksSchema.optional(),
});

export type CustomLink = z.infer<typeof customLinkSchema>;
export type LibraryLinks = z.infer<typeof libraryLinksSchema>;
export type ClassroomLinks = z.infer<typeof classroomLinksSchema>;
export type QuickLinksPreferences = z.infer<typeof quickLinksSchema>;

export const localeSchema = z.object({
  locale: z.enum(['en', 'zh']),
});
export type LocalePreference = z.infer<typeof localeSchema>;
