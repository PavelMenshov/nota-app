/**
 * Student apps: quick links shown on the dashboard (Google Classroom, Library, Turnitin, etc.).
 * Library and Classroom support presets (Google, Teams) plus multiple custom URLs with your own names.
 */
export interface StudentAppLink {
  id: string;
  label: string;
  href: string;
  description: string;
}

export type CustomLink = { url: string; label: string };
export type LibraryLinks = { preset?: 'google' | 'none'; custom?: CustomLink[] };
export type ClassroomLinks = { preset?: 'google' | 'teams' | 'none'; custom?: CustomLink[] };

/** User preferences for library and classroom quick-links (from Settings). */
export interface QuickLinksPreferences {
  library?: LibraryLinks;
  classroom?: ClassroomLinks;
}

const TURNITIN: StudentAppLink = {
  id: 'turnitin',
  label: 'Turnitin',
  href: 'https://www.turnitin.com',
  description: 'Submissions and similarity',
};

const OUTLOOK: StudentAppLink = {
  id: 'outlook',
  label: 'Outlook',
  href: 'https://outlook.office.com',
  description: 'Email and calendar',
};

const ZOOM: StudentAppLink = {
  id: 'zoom',
  label: 'Zoom',
  href: 'https://zoom.us',
  description: 'Video meetings',
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
  if (typeof process === 'undefined' || !process.env) return undefined;
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_URL`;
  const val = (process.env as Record<string, string>)[key];
  if (val === '') return null;
  return val ?? undefined;
}

function getEnvLabel(id: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_LABEL`;
  return (process.env as Record<string, string>)[key];
}

function buildLibraryLinks(preferences?: QuickLinksPreferences): StudentAppLink[] {
  const envUrl = getEnvUrl('library');
  if (envUrl === null) return [];
  const pref = preferences?.library;
  const links: StudentAppLink[] = [];
  // Default: show Google Library when no preference or preset is not 'none'
  const showGoogle = pref === undefined || pref.preset !== 'none';
  if (showGoogle) {
    const p = PRESETS.library.google;
    links.push({
      id: 'library',
      label: getEnvLabel('library') ?? p.label,
      href: envUrl ?? p.href,
      description: p.description,
    });
  }
  (pref?.custom ?? []).forEach((c, i) => {
    links.push({
      id: `library-custom-${i}`,
      label: c.label,
      href: c.url,
      description: 'Search and reserves',
    });
  });
  return links;
}

function buildClassroomLinks(preferences?: QuickLinksPreferences): StudentAppLink[] {
  const envUrl = getEnvUrl('google-classroom');
  if (envUrl === null) return [];
  const pref = preferences?.classroom;
  const links: StudentAppLink[] = [];
  // Default: show Google Classroom when no preference or preset is google; show Teams when preset is teams
  const preset = pref?.preset ?? 'google';
  if (preset === 'google') {
    const p = PRESETS.classroom.google;
    links.push({
      id: 'google-classroom',
      label: getEnvLabel('google-classroom') ?? p.label,
      href: envUrl ?? p.href,
      description: p.description,
    });
  } else if (preset === 'teams') {
    const p = PRESETS.classroom.teams;
    links.push({
      id: 'google-classroom',
      label: p.label,
      href: p.href,
      description: p.description,
    });
  }
  (pref?.custom ?? []).forEach((c, i) => {
    links.push({
      id: `classroom-custom-${i}`,
      label: c.label,
      href: c.url,
      description: 'Classes and assignments',
    });
  });
  return links;
}

function buildOtherLinks(): StudentAppLink[] {
  const apps = [TURNITIN, OUTLOOK, ZOOM];
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
 * Returns student app links. Pass optional preferences (from Settings) to use presets and custom library/classroom links.
 */
export function getStudentAppLinks(preferences?: QuickLinksPreferences): StudentAppLink[] {
  const classroom = buildClassroomLinks(preferences);
  const library = buildLibraryLinks(preferences);
  const others = buildOtherLinks();
  return [...classroom, ...library, ...others];
}
