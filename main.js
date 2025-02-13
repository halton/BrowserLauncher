const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');

const store = new Store();

// Add these channel-to-path mappings
const EDGE_PATHS = {
    'Canary': '/Applications/Microsoft Edge Canary.app',
    'Dev': '/Applications/Microsoft Edge Dev.app',
    'Beta': '/Applications/Microsoft Edge Beta.app',
    'Stable': '/Applications/Microsoft Edge.app'
};

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

ipcMain.handle('update-profiles', (event, profiles) => {
  store.set('profiles', profiles);
  return profiles;
});

// Add new IPC handler for launching Edge
ipcMain.handle('launch-edge', (event, config) => {
    const edgePath = EDGE_PATHS[config.channel];
    if (!edgePath) {
        throw new Error(`Invalid Edge channel: ${config.channel}`);
    }

    // First close the target Edge channel if it's running
    exec(`pkill -f "${edgePath}"`, (killError) => {
        // Ignore kill error as the app might not be running

        // Then launch Edge with the configuration
        const command = `open -a "${edgePath}" --args ${config.arguments}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error launching Edge: ${error}`);
                return;
            }
            // Close the app after successful launch
            // app.quit();
        });
    });
});