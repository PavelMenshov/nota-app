/**
 * Configuration store for runtime API URL and other settings
 * This allows users to configure the API URL without environment variables
 */

const CONFIG_STORAGE_KEY = 'eywa-config';

export interface AppConfig {
  apiUrl?: string;
  autoDetectApiUrl?: boolean;
}

// Get configuration from localStorage
export function getConfig(): AppConfig {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
  }
  
  return {};
}

// Save configuration to localStorage
export function setConfig(config: Partial<AppConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
  }
}

// Clear configuration
export function clearConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear config from localStorage:', error);
  }
}

// Get the effective API URL (with fallback logic)
export function getApiUrl(): string {
  const config = getConfig();
  
  // 1. User-configured URL from settings (highest priority)
  if (config.apiUrl) {
    return config.apiUrl;
  }
  
  // 2. Environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 3. Auto-detect based on current location (if enabled)
  if (config.autoDetectApiUrl && typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    // If we're on localhost, API is probably on port 4000
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return `${currentProtocol}//localhost:4000`;
    }
    
    // Otherwise, assume API is on same host, port 4000
    return `${currentProtocol}//${currentHost}:4000`;
  }
  
  // 4. Default fallback
  return 'http://localhost:4000';
}

// Validate API URL format
export function isValidApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Try to detect local API servers
export async function detectLocalApiServers(): Promise<string[]> {
  const candidates = [
    'http://localhost:4000',
    'http://localhost:3000',
    'http://127.0.0.1:4000',
    'http://127.0.0.1:3000',
  ];
  
  const working: string[] = [];
  
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        working.push(url);
      }
    } catch {
      // Ignore errors
    }
  }
  
  return working;
}
