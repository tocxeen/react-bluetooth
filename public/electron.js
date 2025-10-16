const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      experimentalFeatures: true
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
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

// Grant permission for Bluetooth
app.on('web-contents-created', (event, contents) => {
  let pendingBtSelectCallback = null;
  let pendingBtSelectTimeout = null;
  // NEW: store a preferred device id to auto-select
  let preferredBluetoothDeviceId = null;

  // NEW: allow renderer to set the preferred device id
  ipcMain.on('bluetooth:set-preferred', (_evt, deviceId) => {
    preferredBluetoothDeviceId = deviceId || null;
  });

  contents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();

    // NEW: auto-select preferred device if present
    if (preferredBluetoothDeviceId) {
      const match = (deviceList || []).find(d => d.deviceId === preferredBluetoothDeviceId);
      if (match) {
        try { callback(preferredBluetoothDeviceId); } catch (_) {}
        preferredBluetoothDeviceId = null; // clear after use
        return;
      }
      // no direct match, continue to normal flow
    }

    // Clear previous pending select if any
    if (pendingBtSelectCallback) {
      try { pendingBtSelectCallback(''); } catch (_) {}
      pendingBtSelectCallback = null;
    }
    if (pendingBtSelectTimeout) {
      clearTimeout(pendingBtSelectTimeout);
      pendingBtSelectTimeout = null;
    }

    // Store callback and send devices to renderer
    pendingBtSelectCallback = callback;
    try {
      const simpleList = (deviceList || []).map(d => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName || 'Unknown'
      }));
      contents.send('bluetooth:chooser-open', simpleList);
    } catch (e) {
      // Fallback: cancel if we cannot notify UI
      try { callback(''); } catch (_) {}
      pendingBtSelectCallback = null;
    }

    // Safety timeout to avoid hanging chooser forever
    pendingBtSelectTimeout = setTimeout(() => {
      if (pendingBtSelectCallback) {
        try { pendingBtSelectCallback(''); } catch (_) {}
        pendingBtSelectCallback = null;
      }
    }, 30000);
  });

  // ...existing code for bluetooth-device-added/changed and IPC handlers...
});
