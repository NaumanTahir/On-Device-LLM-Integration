const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    title: "OmniSandbox AI - Autonomous Windows Engine",
    backgroundColor: "#09090b",
    frame: true,
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// IPC Handlers for Local Integration
ipcMain.handle('get-system-stats', async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const gpu = await si.graphics();
    const temp = await si.cpuTemperature();
    
    return {
      cpu: Math.round(cpu.currentLoad),
      memory: Math.round((mem.active / mem.total) * 100),
      gpu: gpu.controllers[0]?.utilizationGpu || 0,
      temp: Math.round(temp.main || 0)
    };
  } catch (e) {
    return { cpu: 0, memory: 0, gpu: 0, temp: 0 };
  }
});

ipcMain.handle('run-local-command', async (event, command) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        success: !error,
        output: stdout || stderr,
        error: error ? error.message : null
      });
    });
  });
});

ipcMain.handle('local-inference', async (event, { url, method, body }) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('search-web', async (event, query) => {
  try {
    // Using a public search API or simple duckduckgo redirect for demo
    // In a real app, this would use a dedicated search API
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    return {
      abstract: data.AbstractText,
      source: data.AbstractSource,
      related: data.RelatedTopics?.slice(0, 3).map(t => t.Text) || []
    };
  } catch (e) {
    return { error: "Search failed: " + e.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', async (event, fullPath) => {
  shell.showItemInFolder(fullPath);
});

ipcMain.handle('save-local-data', async (event, { filename, data }) => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
});

ipcMain.handle('read-local-data', async (event, filename) => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
