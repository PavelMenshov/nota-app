// Application configuration and constants
// Desktop download URLs: set NEXT_PUBLIC_DESKTOP_WIN_URL (and optionally MAC/LINUX) to
// point to the .exe (e.g. GitHub release asset) or leave unset to use the releases page.
const GITHUB_RELEASES_LATEST = 'https://github.com/PavelMenshov/nota-platform/releases/latest';

export const APP_CONFIG = {
  // Application metadata
  APP_NAME: 'Nota',
  APP_VERSION: '0.1.0', // Update this when releasing new versions
  APP_SIZE_MB: '~80MB',

  // URLs
  GITHUB_REPO: 'https://github.com/PavelMenshov/nota-platform',
  DOCS_URL: 'https://github.com/PavelMenshov/nota-platform/tree/main/docs',

  // Download paths: use env for direct asset URL or fallback to GitHub releases page
  DOWNLOADS: {
    WINDOWS: process.env.NEXT_PUBLIC_DESKTOP_WIN_URL || GITHUB_RELEASES_LATEST,
    MAC: process.env.NEXT_PUBLIC_DESKTOP_MAC_URL || GITHUB_RELEASES_LATEST,
    LINUX: process.env.NEXT_PUBLIC_DESKTOP_LINUX_URL || GITHUB_RELEASES_LATEST,
  },

  // True when a direct Windows download URL is configured (for showing "Download for Windows" prominently)
  HAS_WINDOWS_DOWNLOAD: Boolean(process.env.NEXT_PUBLIC_DESKTOP_WIN_URL),

  // Platform names
  PLATFORM_NAMES: {
    WINDOWS: 'Windows',
    MAC: 'macOS',
    LINUX: 'Linux',
  },
};
