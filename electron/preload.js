import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => process.env.npm_package_version || '1.0.0',
  platform: process.platform
});