import { z } from 'zod';

export const libraryProviderSchema = z.enum(['google', 'custom']);
export const classroomProviderSchema = z.enum(['google', 'teams', 'custom']);

export const libraryOptionSchema = z.object({
  provider: libraryProviderSchema,
  customUrl: z.string().url().optional(),
  customLabel: z.string().max(200).optional(),
});
export const classroomOptionSchema = z.object({
  provider: classroomProviderSchema,
  customUrl: z.string().url().optional(),
  customLabel: z.string().max(200).optional(),
});

export const quickLinksSchema = z.object({
  library: libraryOptionSchema.optional(),
  classroom: classroomOptionSchema.optional(),
});

export type LibraryOption = z.infer<typeof libraryOptionSchema>;
export type ClassroomOption = z.infer<typeof classroomOptionSchema>;
export type QuickLinksPreferences = z.infer<typeof quickLinksSchema>;

export const localeSchema = z.object({
  locale: z.enum(['en', 'ru', 'zh']),
});
export type LocalePreference = z.infer<typeof localeSchema>;
