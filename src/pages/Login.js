import React, { useState } from 'react';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('Logging in...');
    try {
      const resp = await fetch('https://backendservices.clicknpay.africa/eticketservices/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Login failed (${resp.status}): ${txt || 'Unknown'}`);
      }
      const data = await resp.json().catch(() => ({}));
      const token = data.token || data.accessToken || data.jwt || data.id_token || data.TOKEN || '';
      if (!token) throw new Error('Invalid response: token missing');

      // Save username for downstream use
      try {
        localStorage.setItem('authUsername', username);
      } catch {}

      onLoggedIn(token);
    } catch (err) {
      setMsg(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 20, width: '90%', maxWidth: 420, textAlign: 'left' }}>
      <h3>Login</h3>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="Enter username"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="Enter password"
            required
          />
        </div>
        <button type="submit" disabled={busy} style={{ padding: '10px 16px', background: '#3a7', color: '#fff', border: 0 }}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {msg && (
        <div style={{ marginTop: 12, padding: 10, border: '1px solid #555' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
