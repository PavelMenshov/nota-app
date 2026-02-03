// API Routes
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  
  // Workspaces
  WORKSPACES: {
    BASE: '/api/workspaces',
    BY_ID: (id: string) => `/api/workspaces/${id}`,
    MEMBERS: (id: string) => `/api/workspaces/${id}/members`,
    SHARE: (id: string) => `/api/workspaces/${id}/share`,
  },
  
  // Pages
  PAGES: {
    BASE: '/api/pages',
    BY_ID: (id: string) => `/api/pages/${id}`,
    BY_WORKSPACE: (workspaceId: string) => `/api/workspaces/${workspaceId}/pages`,
    SEARCH: '/api/pages/search',
  },
  
  // Doc
  DOC: {
    BY_PAGE: (pageId: string) => `/api/pages/${pageId}/doc`,
    SNAPSHOTS: (pageId: string) => `/api/pages/${pageId}/doc/snapshots`,
    COMMENTS: (pageId: string) => `/api/pages/${pageId}/doc/comments`,
  },
  
  // Canvas
  CANVAS: {
    BY_PAGE: (pageId: string) => `/api/pages/${pageId}/canvas`,
    SNAPSHOTS: (pageId: string) => `/api/pages/${pageId}/canvas/snapshots`,
  },
  
  // Sources
  SOURCES: {
    BY_PAGE: (pageId: string) => `/api/pages/${pageId}/sources`,
    BY_ID: (pageId: string, sourceId: string) => `/api/pages/${pageId}/sources/${sourceId}`,
    UPLOAD: (pageId: string) => `/api/pages/${pageId}/sources/upload`,
    ANNOTATIONS: (sourceId: string) => `/api/sources/${sourceId}/annotations`,
    SEARCH: (pageId: string) => `/api/pages/${pageId}/sources/search`,
  },
  
  // Tasks
  TASKS: {
    BASE: '/api/tasks',
    BY_ID: (id: string) => `/api/tasks/${id}`,
    BY_WORKSPACE: (workspaceId: string) => `/api/workspaces/${workspaceId}/tasks`,
    ASSIGNEES: (id: string) => `/api/tasks/${id}/assignees`,
  },
  
  // Calendar
  CALENDAR: {
    BASE: '/api/calendar',
    BY_ID: (id: string) => `/api/calendar/${id}`,
    BY_WORKSPACE: (workspaceId: string) => `/api/workspaces/${workspaceId}/calendar`,
  },
  
  // Export
  EXPORT: {
    CREATE: '/api/export',
    BY_ID: (id: string) => `/api/export/${id}`,
    DOWNLOAD: (id: string) => `/api/export/${id}/download`,
  },
  
  // AI
  AI: {
    SUMMARY: '/api/ai/summary',
    FLASHCARDS: '/api/ai/flashcards',
    USAGE: '/api/ai/usage',
  },
  
  // Activity
  ACTIVITY: {
    BY_PAGE: (pageId: string) => `/api/pages/${pageId}/activity`,
  },
  
  // Realtime
  REALTIME: {
    WS: '/api/realtime',
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Room management
  JOIN_PAGE: 'join_page',
  LEAVE_PAGE: 'leave_page',
  
  // Doc collaboration
  DOC_UPDATE: 'doc_update',
  DOC_AWARENESS: 'doc_awareness',
  
  // Canvas collaboration
  CANVAS_UPDATE: 'canvas_update',
  CANVAS_AWARENESS: 'canvas_awareness',
  
  // Presence
  PRESENCE_UPDATE: 'presence_update',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Comments
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  OWNER: {
    canRead: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManageRoles: true,
    canShare: true,
  },
  EDITOR: {
    canRead: true,
    canEdit: true,
    canDelete: false,
    canInvite: false,
    canManageRoles: false,
    canShare: false,
  },
  VIEWER: {
    canRead: true,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManageRoles: false,
    canShare: false,
  },
} as const;

// AI Limits
export const AI_LIMITS = {
  DAILY_REQUESTS: 50,
  MAX_TOKENS_PER_REQUEST: 4000,
  SUMMARY_MAX_LENGTH: 2000,
  FLASHCARDS_MAX_COUNT: 50,
} as const;

// File limits
export const FILE_LIMITS = {
  MAX_PDF_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_PDF_TYPES: ['application/pdf'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
