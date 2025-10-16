import React, { useState, useEffect } from 'react';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const styles = {
    shell: {
      width: '95%',
      maxWidth: 1100,
      minHeight: isNarrow ? 'auto' : '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: isNarrow ? 0 : 10
    },
    layout: {
      display: 'flex',
      width: '100%',
      flexDirection: isNarrow ? 'column' : 'row',
      minHeight: isNarrow ? 'auto' : 420,
      background: 'transparent',
      borderRadius: 10,
      overflow: 'hidden',
      gap: isNarrow ? 16 : 0
    },
    left: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e6f2f2',
      padding: isNarrow ? '12px 8px' : '24px 16px',
      width: isNarrow ? '100%' : 'auto'
    },
    brandWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      justifyContent: isNarrow ? 'center' : 'flex-start'
    },
    brandMark: {
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #1abc9c, #16a085)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
    },
    brandDot: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#f39c12'
    },
    brandText: {
      fontSize: 22,
      letterSpacing: 0.5
    },
    divider: {
      width: 1,
      background: 'rgba(255,255,255,0.18)',
      margin: isNarrow ? 0 : '0 22px',
      display: isNarrow ? 'none' : 'block'
    },
    right: {
      flex: 1,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isNarrow ? '12px 8px' : '24px 16px',
      width: isNarrow ? '100%' : 'auto'
    },
    card: {
      width: '100%',
      maxWidth: isNarrow ? '100%' : 420,
      textAlign: 'left',
      padding: isNarrow ? '0 12px' : 0
    },
    heading: {
      fontSize: 30,
      fontWeight: 600,
      margin: 0,
      textAlign: isNarrow ? 'center' : 'left'
    },
    sub: {
      marginTop: 6,
      fontSize: 12,
      opacity: 0.85,
      letterSpacing: 0.4,
      textAlign: isNarrow ? 'center' : 'left'
    },
    field: {
      marginTop: 14
    },
    label: {
      display: 'block',
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 6
    },
    input: {
      width: isNarrow ? '100%' : '92%',
      padding: '12px 14px',
      borderRadius: 6,
      border: '1px solid rgba(255,255,255,0.25)',
      outline: 'none',
      background: '#ffffff',
      color: '#111',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
    },
    button: {
      marginTop: 18,
      width: '100%',
      padding: '12px 16px',
      borderRadius: 6,
      border: 0,
      cursor: 'pointer',
      background: 'linear-gradient(180deg, #f39c12, #e67e22)',
      color: '#fff',
      fontWeight: 600,
      letterSpacing: 0.5,
      boxShadow: '0 6px 14px rgba(230,126,34,0.35)'
    },
    helper: {
      textAlign: 'center',
      marginTop: 12,
      fontSize: 12,
      opacity: 0.85
    },
    link: {
      color: '#f39c12',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    msg: {
      marginTop: 12,
      padding: 10,
      border: '1px solid #555',
      borderRadius: 6,
      background: 'rgba(0,0,0,0.25)'
    }
  };

  return (
    <div style={styles.shell}>
      <div style={styles.layout}>
        {/* Left brand panel */}
        <div style={styles.left}>
          <div style={styles.brandWrap}>
            <div style={styles.brandMark}>
              <div style={styles.brandDot} />
            </div>
            <div style={styles.brandText}>ClicknPay</div>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Right login panel */}
        <div style={styles.right}>
          <div style={styles.card}>
            <h1 style={styles.heading}>Welcome</h1>
            <div style={styles.sub}>Please login to Admin Dashboard.</div>

            <form onSubmit={handleLogin}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder="Username"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Password"
                  required
                />
              </div>

              <button type="submit" disabled={busy} style={styles.button}>
                {busy ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div style={styles.helper}>
              <a
                style={styles.link}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMsg('Please contact support to reset your password.');
                }}
              >
                Forgotten your password?
              </a>
            </div>

            {msg && <div style={styles.msg}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
