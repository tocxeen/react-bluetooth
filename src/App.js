import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import BluetoothService from './services/BluetoothService';
import PrinterService from './services/PrinterService';

function App() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    checkBluetoothAvailability();
  }, []);

  const checkBluetoothAvailability = async () => {
    try {
      const available = await BluetoothService.isBluetoothAvailable();
      setBluetoothAvailable(available);
    } catch (err) {
      setError('Bluetooth is not supported in this environment');
    }
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      const foundDevices = await BluetoothService.scanForDevices();
      setDevices(foundDevices);
    } catch (err) {
      setError('Failed to scan for devices: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device) => {
    setConnectionStatus('Connecting...');
    setError('');
    setDebugInfo('');
    
    try {
      setDebugInfo('Attempting GATT connection...');
      await BluetoothService.connectToDevice(device);
      
      setConnectedDevice(device);
      setConnectionStatus('Connected successfully');
      setDebugInfo('Connection established and characteristic found');
      setError('');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setConnectionStatus('');
        setDebugInfo('');
      }, 3000);
    } catch (err) {
      setConnectionStatus('');
      setError('Failed to connect to device: ' + err.message);
      setDebugInfo('Connection failed. Check if device is paired and not connected to another app.');
      console.error('Connection error details:', err);
    }
  };

  const disconnect = async () => {
    try {
      await BluetoothService.disconnect();
      setConnectedDevice(null);
    } catch (err) {
      setError('Failed to disconnect: ' + err.message);
    }
  };

  const printTestPage = async () => {
    if (!connectedDevice) {
      setError('No device connected');
      return;
    }

    setIsPrinting(true);
    setError('');

    try {
      await PrinterService.printTestPage();
      alert('Test page printed successfully!');
    } catch (err) {
      setError('Failed to print: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Clicknpay Point Of Sale</h2>
        
        {!bluetoothAvailable && (
          <div style={{ color: 'red', margin: '20px' }}>
            Bluetooth is not available. Make sure you're running this in Electron with Bluetooth support.
          </div>
        )}

        {connectionStatus && (
          <div style={{ color: 'blue', margin: '10px', padding: '10px', border: '1px solid blue' }}>
            {connectionStatus}
          </div>
        )}

        {debugInfo && (
          <div style={{ color: 'orange', margin: '10px', padding: '10px', border: '1px solid orange', fontSize: '12px' }}>
            Debug: {debugInfo}
          </div>
        )}

        {error && (
          <div style={{ color: 'red', margin: '10px', padding: '10px', border: '1px solid red' }}>
            {error}
          </div>
        )}

        <div style={{ margin: '20px' }}>
          <h3>Device Management</h3>
          
          <button 
            onClick={scanForDevices} 
            disabled={isScanning || !bluetoothAvailable}
            style={{ margin: '10px', padding: '10px 20px' }}
          >
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </button>

          {devices.length > 0 && (
            <div style={{ margin: '20px' }}>
              <h4>Available Devices:</h4>
              {devices.map((device, index) => (
                <div key={index} style={{ margin: '10px', padding: '10px', border: '1px solid white' }}>
                  <strong>{device.name || 'Unknown Device'}</strong>
                  <br />
                  <small>ID: {device.id}</small>
                  <br />
                  <button 
                    onClick={() => connectToDevice(device)}
                    disabled={connectedDevice?.id === device.id}
                    style={{ margin: '5px', padding: '5px 10px' }}
                  >
                    {connectedDevice?.id === device.id ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {connectedDevice && (
            <div style={{ margin: '20px', padding: '20px', border: '2px solid green' }}>
              <h4>Connected Device:</h4>
              <p><strong>{connectedDevice.name || 'Unknown Device'}</strong></p>
              <p>Status: Connected</p>
              
              <div style={{ margin: '10px 0' }}>
                <button 
                  onClick={printTestPage}
                  disabled={isPrinting}
                  style={{ margin: '5px', padding: '10px 20px', backgroundColor: 'green', color: 'white' }}
                >
                  {isPrinting ? 'Printing...' : 'Print Test Page'}
                </button>
                
                <button 
                  onClick={disconnect}
                  style={{ margin: '5px', padding: '10px 20px', backgroundColor: 'red', color: 'white' }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', margin: '20px', opacity: 0.7 }}>
          <p>Note: This application requires Electron with Bluetooth support.</p>
          <p>Make sure Bluetooth is enabled on your system.</p>
        </div>
      </header>
    </div>
  );
}

export default App;
