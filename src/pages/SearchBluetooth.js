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

  return (
    <div style={{ width: '95%', maxWidth: 1000 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Select Bluetooth Printer</h3>
        <div>
          <button onClick={onSkip} style={{ padding: '6px 12px' }}>Skip</button>
        </div>
      </div>

      {!bluetoothAvailable && (
        <div style={{ color: 'red', marginTop: 12 }}>
          Bluetooth is not available. Please enable it and restart the app.
        </div>
      )}

      {status && <div style={{ color: 'deepskyblue', marginTop: 10, border: '1px solid deepskyblue', padding: 8 }}>{status}</div>}
      {error && <div style={{ color: 'salmon', marginTop: 10, border: '1px solid salmon', padding: 8 }}>{error}</div>}

      <button
        onClick={scanForDevices}
        disabled={isScanning || !bluetoothAvailable}
        style={{ margin: '16px 0', padding: '10px 20px' }}
      >
        {isScanning ? 'Scanning...' : 'Scan for Devices'}
      </button>

      {/* Previously saved printer */}
      {!connectedDevice && localStorage.getItem('printerDevice') && (
        <div style={{ margin: '10px 0', padding: 10, border: '1px dashed #777' }}>
          <small>
            Previously selected printer:{' '}
            {(() => {
              try {
                const p = JSON.parse(localStorage.getItem('printerDevice'));
                return `${p?.name || 'Unknown'} (${p?.id || '-'})`;
              } catch { return '-'; }
            })()}
          </small>
        </div>
      )}

      {devices.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <h4>Available Devices</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            {devices.map((d, idx) => (
              <div key={`${d.id}-${idx}`} style={{ border: '1px solid #555', padding: 10, borderRadius: 6 }}>
                <div><strong>{d.name || 'Unknown Device'}</strong></div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {d.id}</div>
                <button
                  onClick={() => connectToDevice(d)}
                  style={{ marginTop: 8, padding: '6px 12px' }}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal chooser for packaged .exe */}
      {showBtModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={cancelBtSelection}
        >
          <div
            style={{ background: '#1e1e1e', color: '#fff', border: '1px solid #444', borderRadius: 8, width: '90%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #333' }}>
              <h3 style={{ margin: 0 }}>Choose a device</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.8 }}>This list updates as new devices are found.</p>
            </div>
            <div style={{ padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
              {btModalDevices.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Scanning...</div>
              ) : (
                btModalDevices.map(d => (
                  <div key={d.deviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', padding: 10, borderRadius: 6, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.deviceName || 'Unknown Device'}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>ID: {d.deviceId}</div>
                    </div>
                    <button onClick={() => chooseBtDevice(d.deviceId)} style={{ padding: '6px 12px' }}>Select</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #333', textAlign: 'right' }}>
              <button onClick={cancelBtSelection} style={{ padding: '8px 14px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
