const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');

const store = new Store();

// Update browser paths mapping for all platforms
const BROWSER_PATHS = {
    'Edge': {
        'win32': {
            'Canary': 'C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe',
            'Dev': 'C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe',
            'Beta': 'C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe',
            'Stable': 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        },
        'darwin': {
            'Canary': '/Applications/Microsoft Edge Canary.app',
            'Dev': '/Applications/Microsoft Edge Dev.app',
            'Beta': '/Applications/Microsoft Edge Beta.app',
            'Stable': '/Applications/Microsoft Edge.app'
        },
        'linux': {
            'Canary': '/usr/bin/microsoft-edge-canary',
            'Dev': '/usr/bin/microsoft-edge-dev',
            'Beta': '/usr/bin/microsoft-edge-beta',
            'Stable': '/usr/bin/microsoft-edge-stable'
        }
    },
    'Chrome': {
        'win32': {
            'Canary': 'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe',
            'Dev': 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
            'Beta': 'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe',
            'Stable': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        },
        'darwin': {
            'Canary': '/Applications/Google Chrome Canary.app',
            'Dev': '/Applications/Google Chrome Dev.app',
            'Beta': '/Applications/Google Chrome Beta.app',
            'Stable': '/Applications/Google Chrome.app'
        },
        'linux': {
            'Canary': '/usr/bin/google-chrome-canary',
            'Dev': '/usr/bin/google-chrome-unstable',
            'Beta': '/usr/bin/google-chrome-beta',
            'Stable': '/usr/bin/google-chrome-stable'
        }
    }
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

// Update the launch handler for cross-platform support
ipcMain.handle('launch-edge', (event, config) => {
    const platform = process.platform;
    const browserPath = BROWSER_PATHS[config.browser][platform]?.[config.channel];

    if (!browserPath) {
        throw new Error(`Invalid browser/channel combination or unsupported platform: ${config.browser} ${config.channel}`);
    }

    // Platform-specific launch commands
    let killCommand, launchCommand;

    switch (platform) {
        case 'win32':
            // Windows
            killCommand = `taskkill /F /IM ${path.basename(browserPath)}`;
            launchCommand = `"${browserPath}" ${config.arguments}`;
            break;

        case 'darwin':
            // macOS
            killCommand = `pkill -f "${browserPath}"`;
            launchCommand = `open -a "${browserPath}" --args ${config.arguments}`;
            break;

        case 'linux':
            // Linux
            killCommand = `pkill -f "${browserPath}"`;
            launchCommand = `"${browserPath}" ${config.arguments}`;
            break;

        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    // First close the target browser if it's running
    exec(killCommand, (killError) => {
        // Ignore kill error as the app might not be running

        // Then launch browser with the configuration
        exec(launchCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error launching browser: ${error}`);
                return;
            }
            // Close the app after successful launch
            // app.quit();
        });
    });
});

// Add version handler
ipcMain.handle('get-version', () => {
    return app.getVersion();
});

// Add external URL handler
ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});