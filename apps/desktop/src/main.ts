import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { APP_CONFIG } from './config';

// Initialize electron store for persisting user preferences
const store = new Store();

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

// Development or production mode
const isDev = process.env.NODE_ENV === 'development';

// Web app URL (use environment variable or default)
const WEB_APP_URL = process.env.WEB_APP_URL || APP_CONFIG.DEFAULT_WEB_APP_URL;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.DEFAULT_WIDTH,
    height: APP_CONFIG.DEFAULT_HEIGHT,
    minWidth: APP_CONFIG.MIN_WIDTH,
    minHeight: APP_CONFIG.MIN_HEIGHT,
    title: 'EYWA - Academic Workspace',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    backgroundColor: '#fbfaf7',
    show: false, // Don't show until ready
  });

  // Load the web app
  if (isDev) {
    mainWindow.loadURL(WEB_APP_URL);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the web app URL or a local build
    mainWindow.loadURL(WEB_APP_URL);
  }

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for updates (in production only)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Workspace',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-workspace');
          },
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'preferences');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal(APP_CONFIG.DOCS_URL);
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal(APP_CONFIG.ISSUES_URL);
          },
        },
        { type: 'separator' },
        {
          label: 'About EYWA',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'about');
          },
        },
      ],
    },
  ];

  // Add Developer menu in development mode
  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.reload();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle IPC messages from renderer process
ipcMain.handle('get-store-value', (_event, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (_event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('app-version', () => {
  return app.getVersion();
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle updates
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});
