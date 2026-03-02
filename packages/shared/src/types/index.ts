// Role types
export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Annotation types
export type AnnotationType = 'HIGHLIGHT' | 'NOTE' | 'DRAWING' | 'TEXT';

// AI types
export type AIUsageType = 'SUMMARY' | 'FLASHCARDS' | 'CHAT' | 'OTHER';

// Export types
export type ExportType = 'PDF' | 'DOCX' | 'MARKDOWN';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  user?: User;
}

// Page types
export interface Page {
  id: string;
  workspaceId: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  order: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Doc types
export interface Doc {
  id: string;
  pageId: string;
  content: unknown;
  plainText: string | null;
}

// Canvas types
export interface Canvas {
  id: string;
  pageId: string;
  content: unknown;
}

// Source types
export interface Source {
  id: string;
  pageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  extractedText: string | null;
  pageCount: number | null;
}

// PDF Annotation types
export interface PDFAnnotation {
  id: string;
  sourceId: string;
  userId: string;
  type: AnnotationType;
  content: string | null;
  color: string | null;
  pageNumber: number;
  position: unknown;
  selectedText: string | null;
}

// Task types
export interface Task {
  id: string;
  workspaceId: string;
  pageId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  workspaceId: string;
  pageId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location: string | null;
  color: string | null;
  meetingUrl: string | null;
}

// Comment types
export interface Comment {
  id: string;
  docId: string;
  userId: string;
  content: string;
  position: unknown;
  parentId: string | null;
  resolved: boolean;
}

// Activity types
export interface Activity {
  id: string;
  pageId: string;
  userId: string;
  action: string;
  details: unknown;
  createdAt: Date;
}

// Flashcard types
export interface FlashcardSet {
  id: string;
  userId: string;
  title: string;
}

export interface Flashcard {
  id: string;
  setId: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  dueDate: Date;
}

// Export Job types
export interface ExportJob {
  id: string;
  userId: string;
  type: ExportType;
  status: JobStatus;
  config: unknown;
  resultUrl: string | null;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
