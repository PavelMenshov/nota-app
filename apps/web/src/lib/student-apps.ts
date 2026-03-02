/**
 * Student apps: quick links shown on the dashboard (Google Classroom, Library, Turnitin, etc.).
 * Override via env: NEXT_PUBLIC_STUDENT_APP_*_URL and NEXT_PUBLIC_STUDENT_APP_*_LABEL.
 * Set URL to empty string to hide an app.
 * Library and Classroom can be customized per user in Settings (Google Library, custom e.g. PolyU; Google Classroom, Teams, custom).
 */
export interface StudentAppLink {
  id: string;
  label: string;
  href: string;
  description: string;
}

/** User preferences for library and classroom quick-links (from Settings). */
export interface QuickLinksPreferences {
  library?: { provider: 'google' | 'custom'; customUrl?: string; customLabel?: string };
  classroom?: { provider: 'google' | 'teams' | 'custom'; customUrl?: string; customLabel?: string };
}

const DEFAULT_CLASSROOM: StudentAppLink = {
  id: 'google-classroom',
  label: 'Google Classroom',
  href: 'https://classroom.google.com',
  description: 'Classes and assignments',
};

const DEFAULT_LIBRARY: StudentAppLink = {
  id: 'library',
  label: 'Library',
  href: 'https://library.google.com',
  description: 'Search and reserves',
};

const TURNITIN: StudentAppLink = {
  id: 'turnitin',
  label: 'Turnitin',
  href: 'https://www.turnitin.com',
  description: 'Submissions and similarity',
};

const PRESETS = {
  library: {
    google: { href: 'https://library.google.com', label: 'Google Library', description: 'Search and reserves' },
  },
  classroom: {
    google: { href: 'https://classroom.google.com', label: 'Google Classroom', description: 'Classes and assignments' },
    teams: { href: 'https://teams.microsoft.com', label: 'Microsoft Teams', description: 'Classes and meetings' },
  },
} as const;

function getEnvUrl(id: string): string | undefined | null {
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_URL`;
  const val = (process.env as Record<string, string>)[key];
  if (val === '') return null;
  return val ?? undefined;
}

function getEnvLabel(id: string): string | undefined {
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_LABEL`;
  return (process.env as Record<string, string>)[key];
}

function buildLibraryLink(preferences?: QuickLinksPreferences): StudentAppLink | null {
  const envUrl = getEnvUrl('library');
  if (envUrl === null) return null;
  const pref = preferences?.library;
  if (pref?.provider === 'custom' && pref.customUrl) {
    return {
      id: 'library',
      label: pref.customLabel ?? 'Library',
      href: pref.customUrl,
      description: 'Search and reserves',
    };
  }
  const preset = PRESETS.library.google;
  return {
    id: 'library',
    label: getEnvLabel('library') ?? (pref?.provider === 'google' ? preset.label : DEFAULT_LIBRARY.label),
    href: envUrl ?? preset.href,
    description: preset.description,
  };
}

function buildClassroomLink(preferences?: QuickLinksPreferences): StudentAppLink | null {
  const envUrl = getEnvUrl('google-classroom');
  if (envUrl === null) return null;
  const pref = preferences?.classroom;
  if (pref?.provider === 'custom' && pref.customUrl) {
    return {
      id: 'google-classroom',
      label: pref.customLabel ?? 'Classroom',
      href: pref.customUrl,
      description: 'Classes and assignments',
    };
  }
  if (pref?.provider === 'teams') {
    const p = PRESETS.classroom.teams;
    return {
      id: 'google-classroom',
      label: pref.customLabel ?? p.label,
      href: pref.customUrl ?? p.href,
      description: p.description,
    };
  }
  const p = PRESETS.classroom.google;
  return {
    id: 'google-classroom',
    label: getEnvLabel('google-classroom') ?? (pref?.provider === 'google' ? p.label : DEFAULT_CLASSROOM.label),
    href: envUrl ?? p.href,
    description: p.description,
  };
}

function buildOtherLinks(): StudentAppLink[] {
  const apps = [TURNITIN];
  return apps
    .map((app) => {
      const envUrl = getEnvUrl(app.id);
      if (envUrl === null) return null;
      const url = envUrl ?? app.href;
      const label = getEnvLabel(app.id) ?? app.label;
      return { ...app, href: url, label };
    })
    .filter((app): app is StudentAppLink => app != null);
}

/**
 * Returns student app links. Pass optional preferences (from Settings) to use user-chosen library and classroom.
 */
export function getStudentAppLinks(preferences?: QuickLinksPreferences): StudentAppLink[] {
  const classroom = buildClassroomLink(preferences);
  const library = buildLibraryLink(preferences);
  const others = buildOtherLinks();
  const links: StudentAppLink[] = [];
  if (classroom) links.push(classroom);
  if (library) links.push(library);
  links.push(...others);
  return links;
}
