import React, { useEffect, useMemo, useState } from 'react';
import BluetoothService from '../services/BluetoothService';

export default function SearchBluetooth({ onConnected, onSkip }) {
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Modal state (custom chooser)
  const [showBtModal, setShowBtModal] = useState(false);
  const [btModalDevices, setBtModalDevices] = useState([]);

  // Electron IPC
  const ipc = useMemo(() => {
    try { return window.require ? window.require('electron').ipcRenderer : null; } catch { return null; }
  }, []);

  // Responsive breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 640);
      setIsTablet(w > 640 && w <= 1024);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const gridCols = useMemo(() => (isMobile ? 1 : isTablet ? 2 : 3), [isMobile, isTablet]);

  useEffect(() => {
    (async () => {
      try {
        setBluetoothAvailable(await BluetoothService.isBluetoothAvailable());
      } catch {
        setBluetoothAvailable(false);
        setError('Bluetooth is not supported in this environment');
      }
    })();
  }, []);

  // IPC listeners for custom chooser (packaged .exe)
  useEffect(() => {
    if (!ipc) return;
    const openChooser = (_evt, list) => {
      const unique = new Map((list || []).map(d => [d.deviceId, d]));
      setBtModalDevices([...unique.values()]);
      setShowBtModal(true);
    };
    const updateChooser = (_evt, list) => {
      const unique = new Map((list || []).map(d => [d.deviceId, d]));
      setBtModalDevices([...unique.values()]);
    };
    ipc.on('bluetooth:chooser-open', openChooser);
    ipc.on('bluetooth:devices-updated', updateChooser);
    return () => {
      ipc.removeListener('bluetooth:chooser-open', openChooser);
      ipc.removeListener('bluetooth:devices-updated', updateChooser);
    };
  }, [ipc]);

  const chooseBtDevice = (deviceId) => {
    if (ipc) ipc.send('bluetooth:select-device', deviceId);
    setShowBtModal(false);
    setBtModalDevices([]);
  };
  const cancelBtSelection = () => {
    if (ipc) ipc.send('bluetooth:cancel-select');
    setShowBtModal(false);
    setBtModalDevices([]);
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setError('');
    setStatus('Scanning for devices...');
    try {
      const found = await BluetoothService.scanForDevices();
      setDevices(found);
      setStatus('Device selection completed.');
      setTimeout(() => setStatus(''), 1500);
    } catch (err) {
      setError(`Failed to scan: ${err.message}`);
      setStatus('');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device) => {
    setStatus('Connecting...');
    setError('');
    try {
      await BluetoothService.connectToDevice(device);
      setConnectedDevice(device);
      setStatus('Connected');
      // Persist minimal info and inform parent
      const info = { id: device.id, name: device.name || '' };
      try { localStorage.setItem('printerDevice', JSON.stringify(info)); } catch {}
      onConnected && onConnected(info);
    } catch (err) {
      setError(`Failed to connect: ${err.message}`);
      setStatus('');
    }
  };

  // Theme + styles (match Home.js)
  const theme = {
    primary: '#00878a',
    accent: '#f39c12',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(0,135,138,0.35)',
    chipBorder: 'rgba(255,255,255,0.25)'
  };
  const styles = {
    shell: { width: '96%', maxWidth: 1200 },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
    pageTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
    actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    btnPrimary: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.primary}`, color: '#fff',
      background: theme.primary, cursor: 'pointer'
    },
    btnSecondary: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.accent}`, color: '#fff',
      background: 'transparent', cursor: 'pointer'
    },
    infoRow: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
      gap: 12,
      marginBottom: 16
    },
    card: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
    },
    cardTitle: { fontWeight: 700, margin: 0, marginBottom: 8 },
    subtle: { fontSize: 12, opacity: 0.8 },
    warn: { fontSize: 12, color: 'salmon' },
    ok: { fontSize: 12, color: theme.accent },
    gridDevices: {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      gap: 12
    },
    deviceCard: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
    },
    statusBox: (color) => ({
      border: `1px solid ${color}`, color, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.15)', marginTop: 8
    }),
    modalPanel: {
      background: '#1e1e1e', color: '#fff', border: `1px solid ${theme.cardBorder}`, borderRadius: 8,
      width: '90%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    },
    chipSaved: {
      border: `1px dashed ${theme.chipBorder}`, borderRadius: 8, padding: 10, marginTop: 10, background: 'transparent'
    }
  };

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={styles.headerRow}>
        <h3 style={styles.pageTitle}>Select Bluetooth Printer</h3>
        <div style={styles.actions}>
          <button onClick={scanForDevices} disabled={isScanning || !bluetoothAvailable} style={styles.btnPrimary}>
            {isScanning ? 'Scanning…' : 'Scan'}
          </button>
          <button onClick={onSkip} style={styles.btnSecondary}>Skip</button>
        </div>
      </div>

      {/* Info cards row */}
      <div style={styles.infoRow}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Bluetooth</h4>
          <div className="subtle" style={styles.subtle}>
            {bluetoothAvailable ? 'Available' : 'Unavailable'} • Ensure Bluetooth is enabled.
          </div>
          {!bluetoothAvailable && (
            <div style={styles.statusBox('salmon')}>Bluetooth is not available. Please enable it and restart the app.</div>
          )}
          {status && <div style={styles.statusBox('deepskyblue')}>{status}</div>}
          {error && <div style={styles.statusBox('salmon')}>{error}</div>}
        </div>

        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Current Session</h4>
          {connectedDevice ? (
            <div>
              <div><strong style={{ color: theme.primary }}>{connectedDevice.name || 'Unknown Device'}</strong></div>
              <div style={styles.subtle}>ID: {connectedDevice.id}</div>
              <div style={styles.ok}>Status: Connected</div>
            </div>
          ) : (
            <div className="subtle" style={styles.subtle}>No device connected</div>
          )}
          {!connectedDevice && localStorage.getItem('printerDevice') && (
            <div style={styles.chipSaved}>
              <small>
                Previously selected:{' '}
                {(() => {
                  try {
                    const p = JSON.parse(localStorage.getItem('printerDevice'));
                    return `${p?.name || 'Unknown'} (${p?.id || '-'})`;
                  } catch { return '-'; }
                })()}
              </small>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Actions</h4>
          <div className="subtle" style={styles.subtle}>Choose a device below to connect and continue.</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={scanForDevices} disabled={isScanning || !bluetoothAvailable} style={styles.btnPrimary}>
              {isScanning ? 'Scanning…' : 'Scan for Devices'}
            </button>
          </div>
        </div>
      </div>

      {/* Devices grid */}
      {devices.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '8px 0' }}>
            <h4 style={{ margin: 0 }}>Available Devices</h4>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{devices.length} found</span>
          </div>
          <div style={styles.gridDevices}>
            {devices.map((d, idx) => (
              <div key={`${d.id}-${idx}`} style={styles.deviceCard}>
                <div><strong>{d.name || 'Unknown Device'}</strong></div>
                <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>ID: {d.id}</div>
                <button
                  onClick={() => connectToDevice(d)}
                  style={{ ...styles.btnPrimary, marginTop: 10 }}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal chooser for packaged .exe */}
      {showBtModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={cancelBtSelection}
        >
          <div style={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` }}>
              <h3 style={{ margin: 0 }}>Choose a device</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.8 }}>This list updates as new devices are found.</p>
            </div>
            <div style={{ padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
              {btModalDevices.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Scanning...</div>
              ) : (
                btModalDevices.map(d => (
                  <div key={d.deviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.cardBorder}`, padding: 10, borderRadius: 6, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.deviceName || 'Unknown Device'}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>ID: {d.deviceId}</div>
                    </div>
                    <button onClick={() => chooseBtDevice(d.deviceId)} style={styles.btnPrimary}>Select</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${theme.cardBorder}`, textAlign: 'right' }}>
              <button onClick={cancelBtSelection} style={styles.btnSecondary}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
