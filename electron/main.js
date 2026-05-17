import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

let mainWindow;
let serverProcess;

function startBackendServer() {
  const appPath = app.getAppPath();
  // In production, server is at appPath/server/index.js
  // But when running from asar, we need to handle it differently
  const serverPath = path.join(appPath, 'server', 'index.js');

  console.log('App path:', appPath);
  console.log('Server path:', serverPath);

  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(appPath, 'server')
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });

  serverProcess.on('uncaughtException', (err) => {
    console.error('Server uncaught exception:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:3001');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});