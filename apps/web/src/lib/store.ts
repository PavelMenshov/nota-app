import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        // Set cookie for Next.js middleware route protection
        if (typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `nota-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
        }
        set({ token, user });
      },
      updateUser: (userData) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...userData } });
        }
      },
      clearAuth: () => {
        // Clear the auth cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'nota-token=; path=/; max-age=0';
        }
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'nota-auth',
    }
  )
);

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

interface Page {
  id: string;
  title: string;
  icon: string | null;
  workspaceId: string;
}

interface AppState {
  currentWorkspace: Workspace | null;
  currentPage: Page | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentPage: (page: Page | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentWorkspace: null,
  currentPage: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
