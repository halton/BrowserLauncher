const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for profile management
ipcMain.handle('save-profile', (event, profile) => {
  let profiles = store.get('profiles') || [];
  profiles.push(profile);
  store.set('profiles', profiles);
  return profiles;
});

ipcMain.handle('get-profiles', () => {
  return store.get('profiles') || [];
});

ipcMain.handle('remove-profile', (event, index) => {
  let profiles = store.get('profiles') || [];
  profiles.splice(index, 1);
  store.set('profiles', profiles);
  return profiles;
});

ipcMain.handle('move-profile', (event, { fromIndex, toIndex }) => {
  let profiles = store.get('profiles') || [];
  const [removed] = profiles.splice(fromIndex, 1);
  profiles.splice(toIndex, 0, removed);
  store.set('profiles', profiles);
  return profiles;
});