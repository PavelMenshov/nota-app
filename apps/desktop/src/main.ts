import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
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

// Track load attempts for retry logic
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 5;

function loadErrorPage() {
  if (!mainWindow) return;
  
  const errorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Connection Error - Nota</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(to bottom, #fbfaf7, #f8f6f2);
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: #141414;
          }
          .container {
            max-width: 500px;
            padding: 40px;
            text-align: center;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #5b6167;
            margin-bottom: 8px;
          }
          .url {
            background: rgba(31, 122, 74, 0.1);
            padding: 8px 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            margin: 20px 0;
          }
          .steps {
            text-align: left;
            margin: 24px 0;
            padding: 20px;
            background: white;
            border-radius: 12px;
            border: 1px solid rgba(20, 20, 20, 0.1);
          }
          .steps h3 {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            font-size: 13px;
            color: #5b6167;
            margin-bottom: 8px;
            line-height: 1.5;
          }
          .steps code {
            background: rgba(31, 122, 74, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
          button {
            background: linear-gradient(to bottom, #1f7a4a, rgba(31, 122, 74, 0.92));
            border: 1px solid rgba(31, 122, 74, 0.45);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 16px 34px rgba(31, 122, 74, 0.18);
          }
          button:hover {
            background: linear-gradient(to bottom, #1f7a4a, rgba(31, 122, 74, 0.86));
          }
          button:active {
            transform: translateY(1px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠️</div>
          <h1>Unable to Connect to Nota</h1>
          <p>The desktop app couldn't connect to the Nota web application.</p>
          <div class="url">${WEB_APP_URL}</div>
          
          <div class="steps">
            <h3>To fix this issue:</h3>
            <ol>
              <li>Make sure the Nota web server is running on port 3001:<br><code>pnpm dev</code> or <code>pnpm dev:web</code></li>
              <li>Check if the API server is running on port 4000:<br><code>pnpm dev:api</code></li>
              <li>Verify Docker services are up:<br><code>docker compose up -d</code></li>
              <li>Check that ports 3001 (web) and 4000 (API) are not blocked</li>
            </ol>
          </div>
          
          <button onclick="location.reload()">Retry Connection</button>
        </div>
      </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  mainWindow.show();
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.DEFAULT_WIDTH,
    height: APP_CONFIG.DEFAULT_HEIGHT,
    minWidth: APP_CONFIG.MIN_WIDTH,
    minHeight: APP_CONFIG.MIN_HEIGHT,
    title: 'Nota - Academic Workspace',
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

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (code: ${errorCode})`);
    
    // Ignore aborted loads (user navigation)
    if (errorCode === -3) return;
    
    loadAttempts++;
    
    if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
      console.error(`Maximum load attempts (${MAX_LOAD_ATTEMPTS}) reached. Showing error page.`);
      loadErrorPage();
    } else {
      console.log(`Retrying load... (attempt ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS})`);
      const delay = Math.min(Math.pow(2, loadAttempts) * 1000, 10000); // Exponential backoff capped at 10s
      setTimeout(() => {
        mainWindow?.loadURL(WEB_APP_URL);
      }, delay);
    }
  });

  // Handle renderer crashes
  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    const response = dialog.showMessageBoxSync(mainWindow!, {
      type: 'error',
      title: 'Nota Crashed',
      message: 'The application has crashed. Would you like to restart?',
      buttons: ['Restart', 'Close'],
      defaultId: 0,
    });
    
    if (response === 0) {
      mainWindow?.reload();
    } else {
      app.quit();
    }
  });

  // Handle unresponsive window
  mainWindow.on('unresponsive', () => {
    console.warn('Window became unresponsive');
  });

  // Reset load attempts on successful load
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Successfully loaded web app');
    loadAttempts = 0;
  });

  // Load the web app
  console.log(`Loading Nota from: ${WEB_APP_URL}`);
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
          label: 'About Nota',
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
