import { getApiUrl, getConfig } from './config-store';

export { getApiUrl, getConfig, setConfig, detectLocalApiServers, isValidApiUrl } from './config-store';

// Helper to detect if we're running in a mobile environment
function isMobileEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get a more helpful API URL for error messages
function getApiUrlInfo(): { url: string; isFallback: boolean } {
  const config = getConfig();
  const url = getApiUrl();
  const isFallback = !config.apiUrl && !process.env.NEXT_PUBLIC_API_URL;
  return {
    url,
    isFallback
  };
}

interface FetchOptions extends RequestInit {
  token?: string;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false,
    public helpText?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if the API is reachable
async function checkApiHealth(apiUrl?: string): Promise<boolean> {
  const url = apiUrl || getApiUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, retries = 2, retryDelay = 1000, timeout = 10000, ...fetchOptions } = options;
  
  // Get API URL dynamically for each request
  const apiUrl = getApiUrl();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.status === 409 ? 'User already exists' : 'An error occurred' 
        }));
        throw new ApiError(
          error.message || 'An error occurred',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < retries) {
          await wait(retryDelay * (attempt + 1));
          continue;
        }
        
        const apiInfo = getApiUrlInfo();
        const helpText = apiInfo.isFallback 
          ? 'Using default API URL. Set NEXT_PUBLIC_API_URL environment variable if your API is running on a different address.'
          : '';
        
        throw new ApiError(
          `Request timed out after ${timeout}ms. The server might be slow or unreachable.`,
          undefined,
          true,
          helpText
        );
      }
      
      // Handle network errors (fetch failures - TypeError indicates network error)
      if (error instanceof TypeError) {
        // Check if it's a network error - retry
        if (attempt < retries) {
          await wait(retryDelay * (attempt + 1));
          continue;
        }
        
        // After retries, check if API is reachable
        const isApiUp = await checkApiHealth();
        const apiInfo = getApiUrlInfo();
        
        const errorMessage = isApiUp 
          ? 'Network error occurred. Please check your connection and try again.'
          : 'Unable to connect to the server. Please ensure the API server is running.';
        
        let helpText = `API URL: ${apiInfo.url}`;
        
        if (apiInfo.isFallback) {
          helpText += '\n\nNote: Using default API URL. If your API is on a different address, set the NEXT_PUBLIC_API_URL environment variable.';
        }
        
        if (isMobileEnvironment()) {
          helpText += '\n\nMobile users: Make sure you\'re using the correct server IP address instead of localhost.';
        }
        
        throw new ApiError(
          errorMessage,
          undefined,
          true,
          helpText
        );
      }
      
      // For API errors (like 409, 401, etc.), don't retry
      if (error instanceof ApiError) {
        throw error;
      }
      
      // For unknown errors, retry
      if (attempt < retries) {
        await wait(retryDelay * (attempt + 1));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new ApiError('Request failed after retries', undefined, true);
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ accessToken: string; user: { id: string; email: string; name: string | null } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  register: (email: string, password: string, name: string) =>
    fetchApi<{ accessToken: string; user: { id: string; email: string; name: string | null } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    ),

  me: (token: string) =>
    fetchApi<{ id: string; email: string; name: string | null; avatarUrl: string | null }>(
      '/api/auth/me',
      { token }
    ),
};

// Workspaces API
export const workspacesApi = {
  list: (token: string) =>
    fetchApi<Array<{ id: string; name: string; description: string | null; _count: { pages: number } }>>(
      '/api/workspaces',
      { token }
    ),

  create: (token: string, data: { name: string; description?: string }) =>
    fetchApi<{ id: string; name: string }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  get: (token: string, id: string) =>
    fetchApi<{
      id: string;
      name: string;
      description: string | null;
      pages: Array<{ id: string; title: string; icon: string | null }>;
      members: Array<{ id: string; role: string; user: { id: string; name: string | null; email: string } }>;
    }>(`/api/workspaces/${id}`, { token }),

  update: (token: string, id: string, data: { name?: string; description?: string }) =>
    fetchApi<{ id: string; name: string }>(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    fetchApi<{ success: boolean }>(`/api/workspaces/${id}`, { method: 'DELETE', token }),
};

// Pages API
export const pagesApi = {
  create: (token: string, data: { workspaceId: string; title: string; parentId?: string }) =>
    fetchApi<{ id: string; title: string }>('/api/pages', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  get: (token: string, id: string) =>
    fetchApi<{
      id: string;
      title: string;
      icon: string | null;
      coverImage: string | null;
      doc: { id: string; content: unknown; plainText: string | null } | null;
      canvas: { id: string; content: unknown } | null;
      sources: Array<{ id: string; fileName: string; fileUrl: string; pageCount: number | null }>;
    }>(`/api/pages/${id}`, { token }),

  update: (token: string, id: string, data: { title?: string; icon?: string; coverImage?: string }) =>
    fetchApi<{ id: string; title: string }>(`/api/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    fetchApi<{ success: boolean }>(`/api/pages/${id}`, { method: 'DELETE', token }),

  search: (token: string, workspaceId: string, query: string) =>
    fetchApi<Array<{ id: string; title: string; doc: { plainText: string | null } | null }>>(
      `/api/pages/search?workspaceId=${workspaceId}&q=${encodeURIComponent(query)}`,
      { token }
    ),
};

// Doc API
export const docApi = {
  get: (token: string, pageId: string) =>
    fetchApi<{ id: string; content: unknown; plainText: string | null }>(`/api/pages/${pageId}/doc`, {
      token,
    }),

  update: (token: string, pageId: string, data: { content: unknown; plainText?: string }) =>
    fetchApi<{ id: string }>(`/api/pages/${pageId}/doc`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
};

// Canvas API
export const canvasApi = {
  get: (token: string, pageId: string) =>
    fetchApi<{ id: string; content: unknown }>(`/api/pages/${pageId}/canvas`, { token }),

  update: (token: string, pageId: string, data: { content: unknown }) =>
    fetchApi<{ id: string }>(`/api/pages/${pageId}/canvas`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
};

// Tasks API
export const tasksApi = {
  list: (token: string, workspaceId: string) =>
    fetchApi<
      Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        dueDate: string | null;
        creator: { id: string; name: string | null };
        page: { id: string; title: string } | null;
      }>
    >(`/api/tasks?workspaceId=${workspaceId}`, { token }),

  create: (
    token: string,
    data: {
      workspaceId: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
      pageId?: string;
    }
  ) =>
    fetchApi<{ id: string; title: string }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (
    token: string,
    id: string,
    data: { title?: string; description?: string; status?: string; priority?: string; dueDate?: string }
  ) =>
    fetchApi<{ id: string }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    fetchApi<{ success: boolean }>(`/api/tasks/${id}`, { method: 'DELETE', token }),
};

// Calendar API
export const calendarApi = {
  list: (token: string, workspaceId: string, startDate?: string, endDate?: string) => {
    let url = `/api/calendar?workspaceId=${workspaceId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return fetchApi<
      Array<{
        id: string;
        title: string;
        description: string | null;
        startTime: string;
        endTime: string;
        allDay: boolean;
        location: string | null;
        color: string | null;
      }>
    >(url, { token });
  },

  create: (
    token: string,
    data: {
      workspaceId: string;
      title: string;
      startTime: string;
      endTime: string;
      description?: string;
      allDay?: boolean;
      location?: string;
      color?: string;
    }
  ) =>
    fetchApi<{ id: string }>('/api/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: string, data: Partial<{ title: string; startTime: string; endTime: string }>) =>
    fetchApi<{ id: string }>(`/api/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    fetchApi<{ success: boolean }>(`/api/calendar/${id}`, { method: 'DELETE', token }),
};

// AI API
export const aiApi = {
  summary: (token: string, pageId: string, options?: { includeDoc?: boolean; includeSources?: boolean }) =>
    fetchApi<{ summary: string; tokensUsed: number; pageTitle: string }>('/api/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ pageId, ...options }),
      token,
    }),

  flashcards: (token: string, pageId: string, options?: { count?: number; title?: string }) =>
    fetchApi<{
      flashcardSet: { id: string; title: string; cards: Array<{ id: string; front: string; back: string }> };
      tokensUsed: number;
    }>('/api/ai/flashcards', {
      method: 'POST',
      body: JSON.stringify({ pageId, ...options }),
      token,
    }),

  usage: (token: string) =>
    fetchApi<{
      today: { requests: number; tokens: number; limit: number; remaining: number };
      total: { requests: number; tokens: number };
    }>('/api/ai/usage', { token }),
};

// Export API
export const exportApi = {
  create: (token: string, type: 'PDF' | 'DOCX' | 'MARKDOWN', config: { pageIds?: string[]; workspaceId?: string }) =>
    fetchApi<{ id: string; status: string }>('/api/export', {
      method: 'POST',
      body: JSON.stringify({ type, config }),
      token,
    }),

  get: (token: string, id: string) =>
    fetchApi<{ id: string; status: string; resultUrl: string | null }>(`/api/export/${id}`, { token }),

  list: (token: string) =>
    fetchApi<Array<{ id: string; type: string; status: string; createdAt: string }>>('/api/export', { token }),
};

export default fetchApi;
