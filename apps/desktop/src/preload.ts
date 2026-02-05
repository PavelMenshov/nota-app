import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  getStoreValue: (key: string) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke('set-store-value', key, value),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // Menu actions listener
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  
  // Update notifications
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback());
  },
  
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: any) => Promise<void>;
      getAppVersion: () => Promise<string>;
      onMenuAction: (callback: (action: string) => void) => void;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
    };
  }
}
