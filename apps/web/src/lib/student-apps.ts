/**
 * Student apps: quick links shown on the dashboard (Google Classroom, Library, Turnitin, etc.).
 * Override via env: NEXT_PUBLIC_STUDENT_APP_*_URL and NEXT_PUBLIC_STUDENT_APP_*_LABEL.
 * Set URL to empty string to hide an app.
 */
export interface StudentAppLink {
  id: string;
  label: string;
  href: string;
  description: string;
}

const defaults: StudentAppLink[] = [
  {
    id: 'google-classroom',
    label: 'Google Classroom',
    href: 'https://classroom.google.com',
    description: 'Classes and assignments',
  },
  {
    id: 'library',
    label: 'Library',
    href: 'https://library.google.com',
    description: 'Search and reserves',
  },
  {
    id: 'turnitin',
    label: 'Turnitin',
    href: 'https://www.turnitin.com',
    description: 'Submissions and similarity',
  },
];

function getEnvUrl(id: string): string | undefined | null {
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_URL`;
  const val = (process.env as Record<string, string>)[key];
  if (val === '') return null; // hide app
  return val ?? undefined;
}

function getEnvLabel(id: string): string | undefined {
  const key = `NEXT_PUBLIC_STUDENT_APP_${id.toUpperCase().replaceAll('-', '_')}_LABEL`;
  return (process.env as Record<string, string>)[key];
}

export function getStudentAppLinks(): StudentAppLink[] {
  return defaults
    .map((app) => {
      const envUrl = getEnvUrl(app.id);
      if (envUrl === null) return null;
      const url = envUrl ?? app.href;
      const label = getEnvLabel(app.id) ?? app.label;
      return { ...app, href: url, label };
    })
    .filter((app): app is StudentAppLink => app != null);
}
