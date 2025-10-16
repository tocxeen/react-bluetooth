import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './pages/Login';
import SearchBluetooth from './pages/SearchBluetooth';
import Home from './pages/Home';
import CategoryDetails from './pages/CategoryDetails';
import BluetoothService from './services/BluetoothService'; // NEW

function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'search' | 'home' | 'category'
  const [token, setToken] = useState('');
  const [printer, setPrinter] = useState(null); // { id, name } persisted
  const [selectedEvent, setSelectedEvent] = useState(null);      // NEW
  const [selectedCategory, setSelectedCategory] = useState(null); // NEW

  useEffect(() => {
    // Restore session
    const savedToken = localStorage.getItem('authToken');
    const savedPrinter = localStorage.getItem('printerDevice');
    if (savedToken) setToken(savedToken);
    if (savedPrinter) {
      try {
        const parsed = JSON.parse(savedPrinter);
        setPrinter(parsed);
        // NEW: attempt silent reconnect
        BluetoothService.attemptAutoReconnect(parsed).catch(() => {});
      } catch {}
    }
    // Decide initial screen
    if (!savedToken) setScreen('login');
    else if (!savedPrinter) setScreen('search');
    else setScreen('home');
  }, []);

  const handleLoggedIn = (t) => {
    setToken(t);
    try { localStorage.setItem('authToken', t); } catch {}
    setScreen('search');
  };

  const handlePrinterConnected = (info) => {
    setPrinter(info); // { id, name }
    try { localStorage.setItem('printerDevice', JSON.stringify(info)); } catch {}
    setScreen('home');
  };

  const handleLogout = () => {
    setToken('');
    setPrinter(null);
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('printerDevice');
    } catch {}
    setScreen('login');
  };

  const handleOpenCategory = (ev, cat) => { // NEW
    setSelectedEvent(ev);
    setSelectedCategory(cat);
    setScreen('category');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2 style={{ marginBottom: 8 }}>Clicknpay Point Of Sale</h2>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
          {screen !== 'login' && (
            <>
              <span>Logged in</span>
              {printer ? <> • Printer: {printer.name || 'Unknown'} ({printer.id})</> : ' • No printer selected'}
              <button onClick={handleLogout} style={{ marginLeft: 10, padding: '4px 10px' }}>Logout</button>
            </>
          )}
        </div>

        {screen === 'login' && (
          <Login onLoggedIn={handleLoggedIn} />
        )}

        {screen === 'search' && (
          <SearchBluetooth
            onConnected={(device) => handlePrinterConnected({ id: device.id, name: device.name || '' })}
            onSkip={() => setScreen('home')}
          />
        )}

        {screen === 'home' && (
          <Home
            token={token}
            printer={printer}
            onChangePrinter={() => setScreen('search')}
            onOpenCategory={handleOpenCategory} // NEW
          />
        )}

        {screen === 'category' && ( // NEW
          <CategoryDetails
            token={token}
            event={selectedEvent}
            category={selectedCategory}
            onBack={() => setScreen('home')}
          />
        )}
      </header>
    </div>
  );
}

export default App;
