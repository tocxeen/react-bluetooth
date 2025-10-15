const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true
    }
  });

  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  // Allow Web Bluetooth in packaged app
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    if (permission === 'bluetooth' || permission === 'bluetoothScan' || permission === 'bluetoothConnect') {
      return callback(true);
    }
    callback(true);
  });

  // Optional Win workaround
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Bridge Web Bluetooth chooser to renderer modal (aggregated, scrollable)
let pendingBtSelectCallback = null;
let pendingBtSelectTimeout = null;
let deviceMap = new Map();

app.on('web-contents-created', (event, contents) => {
  contents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();

    // Reset state for new session
    deviceMap = new Map();
    (deviceList || []).forEach(d => deviceMap.set(d.deviceId, d));

    // Cancel previous
    if (pendingBtSelectCallback) {
      try { pendingBtSelectCallback(''); } catch (_) {}
    }
    if (pendingBtSelectTimeout) clearTimeout(pendingBtSelectTimeout);

    pendingBtSelectCallback = callback;

    // Open modal with initial list
    const simpleList = [...deviceMap.values()].map(d => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName || 'Unknown'
    }));
    contents.send('bluetooth:chooser-open', simpleList);

    // Timeout safety
    pendingBtSelectTimeout = setTimeout(() => {
      if (pendingBtSelectCallback) {
        try { pendingBtSelectCallback(''); } catch (_) {}
        pendingBtSelectCallback = null;
      }
    }, 30000);
  });

  // Live updates while chooser open
  contents.on('bluetooth-device-added', (_e, device) => {
    if (!pendingBtSelectCallback) return;
    deviceMap.set(device.deviceId, device);
    const list = [...deviceMap.values()].map(d => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName || 'Unknown'
    }));
    contents.send('bluetooth:devices-updated', list);
  });

  contents.on('bluetooth-device-changed', (_e, device) => {
    if (!pendingBtSelectCallback) return;
    deviceMap.set(device.deviceId, device);
    const list = [...deviceMap.values()].map(d => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName || 'Unknown'
    }));
    contents.send('bluetooth:devices-updated', list);
  });
});

// Renderer selects/cancels device
ipcMain.on('bluetooth:select-device', (_evt, deviceId) => {
  if (pendingBtSelectTimeout) {
    clearTimeout(pendingBtSelectTimeout);
    pendingBtSelectTimeout = null;
  }
  if (pendingBtSelectCallback) {
    try { pendingBtSelectCallback(deviceId || ''); } catch (_) {}
    pendingBtSelectCallback = null;
  }
});

ipcMain.on('bluetooth:cancel-select', () => {
  if (pendingBtSelectTimeout) {
    clearTimeout(pendingBtSelectTimeout);
    pendingBtSelectTimeout = null;
  }
  if (pendingBtSelectCallback) {
    try { pendingBtSelectCallback(''); } catch (_) {}
    pendingBtSelectCallback = null;
  }
});
