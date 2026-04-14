const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  runLocalCommand: (command) => ipcRenderer.invoke('run-local-command', command),
  localInference: (data) => ipcRenderer.invoke('local-inference', data),
  searchWeb: (query) => ipcRenderer.invoke('search-web', query),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  saveLocalData: (filename, data) => ipcRenderer.invoke('save-local-data', { filename, data }),
  readLocalData: (filename) => ipcRenderer.invoke('read-local-data', filename),
  isElectron: true
});

window.addEventListener('DOMContentLoaded', () => {
  // ... existing code if any
});
