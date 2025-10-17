import React, { useEffect, useMemo, useState } from 'react';
import BluetoothService from '../services/BluetoothService';

export default function Home({ token, printer, onChangePrinter, onOpenCategory }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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

  const fetchEvents = async () => {
    setLoading(true);
    setErr('');
    try {
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch('https://backendservices.clicknpay.africa/eticketservices/event/mobileFindActiveEvents', { headers });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Events fetch failed (${resp.status}): ${txt || 'Unknown'}`);
      }
      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error('Unexpected events response');
      const sorted = [...data].sort((a, b) => {
        const pr = (a.displayPriority || 0) - (b.displayPriority || 0);
        return pr !== 0 ? pr : (a.eventDate || 0) - (b.eventDate || 0);
      });
      // remove all events except 741 and 777 (id may be string or number)
      const allowed = new Set([ '741', '777']);
      setEvents(sorted.filter(ev => allowed.has(String(ev.id))));
    } catch (e) {
      setErr(e.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []); // on mount

  // NEW: live connection status (not just saved printer presence)
  const [printerConnected, setPrinterConnected] = useState(false);
  useEffect(() => {
    const update = () => setPrinterConnected(!!BluetoothService.isConnected?.());
    update();
    const dev = BluetoothService.getConnectedDevice?.();
    const onDisc = () => setPrinterConnected(false);
    try { dev && dev.addEventListener('gattserverdisconnected', onDisc); } catch {}
    const id = setInterval(update, 2000);
    return () => {
      try { dev && dev.removeEventListener('gattserverdisconnected', onDisc); } catch {}
      clearInterval(id);
    };
  }, []);

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
    gridStats: {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(gridCols, 3)}, minmax(0, 1fr))`,
      gap: 12,
      marginBottom: 12
    },
    statCard: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
    },
    statLabel: { fontSize: 12, opacity: 0.75, marginBottom: 6 },
    statValue: { fontSize: 24, fontWeight: 800, color: theme.accent },

    // Printer and status cards row
    infoRow: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr',
      gap: 12,
      marginBottom: 16
    },
    card: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
    },
    cardTitle: { fontWeight: 700, margin: 0, marginBottom: 8 },
    subtle: { fontSize: 12, opacity: 0.8 },

    // Events section
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '8px 0' },
    gridEvents: {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
      gap: 12
    },
    eventCard: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8
    },
    eventTitle: { fontWeight: 700, margin: 0 },
    eventMeta: { fontSize: 12, opacity: 0.8 },
    chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: {
      border: `1px solid ${theme.chipBorder}`, borderRadius: 999, padding: '4px 10px', fontSize: 12,
      background: 'transparent', color: '#fff', cursor: 'pointer'
    },
    more: { fontSize: 12, opacity: 0.7 },

    errorBox: { color: 'salmon', border: '1px solid salmon', padding: 8, borderRadius: 8, background: 'rgba(255,0,0,0.05)', marginTop: 10 },
    warnBox: { border: '1px solid #ff9966', color: '#ff9966', padding: 10, borderRadius: 8, background: 'rgba(255,153,102,0.1)', marginBottom: 12 } // NEW
  };

  // Quick derived stats
  const activeCount = events.length;
  const categoriesCount = useMemo(
    () => events.reduce((sum, ev) => sum + (Array.isArray(ev.eventTicketCategories) ? ev.eventTicketCategories.length : 0), 0),
    [events]
  );

  return (
    <div style={styles.shell}>
      {/* Header row */}
      <div style={styles.headerRow}>
        <h3 style={styles.pageTitle}>Dashboard</h3>
        <div style={styles.actions}>
          <button onClick={fetchEvents} style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={onChangePrinter} style={styles.btnSecondary}>
            Change Printer
          </button>
        </div>
      </div>

      {/* NEW: show live warning if printer is not connected */}
      {!printerConnected && (
        <div style={styles.warnBox}>
          Printer Not Connected. Please scan and connect a printer.
          <button onClick={onChangePrinter} style={{ ...styles.btnPrimary, marginLeft: 10 }}>Scan for Printer</button>
        </div>
      )}

      {/* Stats cards */}
      <div style={styles.gridStats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active Events</div>
          <div style={styles.statValue}>{activeCount}</div>
          <div className="subtle" style={styles.subtle}>Total events currently active</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Ticket Categories</div>
          <div style={styles.statValue}>{categoriesCount}</div>
          <div className="subtle" style={styles.subtle}>Across all active events</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Printer</div>
          <div style={styles.statValue} title={printer?.id || ''}>
            {printerConnected ? 'Connected' : 'Not Connected'}
          </div>
          <div className="subtle" style={styles.subtle}>
            {printerConnected ? (printer?.name || 'Unknown') : (printer ? `Saved: ${printer.name || 'Unknown'}` : 'Select a printer to start')}
          </div>
        </div>
      </div>

      {/* Info row cards */}
      <div style={styles.infoRow}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Selected Printer</h4>
          <div>
            <div><strong style={{ color: theme.primary }}>{printer ? (printer.name || 'Unknown') : 'None'}</strong></div>
            <div style={styles.subtle}>{printer ? `ID: ${printer.id}` : 'No printer selected'}</div>
            <div style={styles.subtle}>Status: {printerConnected ? 'Connected' : 'Not Connected'}</div>
          </div>
          {!printerConnected && (
            <div style={{ marginTop: 10 }}>
              <button onClick={onChangePrinter} style={styles.btnPrimary}>Scan for Printer</button>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h4 style={styles.cardTitle}>System</h4>
          <div style={styles.subtle}>
            Token: {token ? 'Available' : 'Missing'} • View and sell event tickets by selecting a category.
          </div>
        </div>
      </div>

      {/* Errors */}
      {err && <div style={styles.errorBox}>{err}</div>}

      {/* Events section */}
      <div style={styles.sectionHeader}>
        <h4 style={{ margin: 0 }}>Active Events</h4>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{activeCount} total</span>
      </div>

      {loading && <div style={{ opacity: 0.8 }}>Loading events...</div>}
      {!loading && activeCount === 0 && <div style={{ opacity: 0.8 }}>No events available.</div>}

      <div style={styles.gridEvents}>
        {events.map((ev) => (
          <div key={ev.id} style={styles.eventCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
              <div>
                <div style={styles.eventTitle}>{ev.description}</div>
                <div style={styles.eventMeta}>
                  {new Date(ev.eventDate).toLocaleString()} • {ev.city || ''}{ev.venueName ? ` • ${ev.venueName}` : ''}
                </div>
              </div>
              {/* Accent dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.accent, marginTop: 4 }} />
            </div>

            {(() => {
              const allCats = Array.isArray(ev.eventTicketCategories) ? ev.eventTicketCategories : [];
              const cats = String(ev.id) === '741'
                ? allCats.filter(cat => String(cat.id) === '2037')
                : allCats;
              if (cats.length === 0) return null;
              return (
                <div style={styles.chipRow}>
                  {cats.slice(0, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onOpenCategory && onOpenCategory(ev, cat)}
                      style={styles.chip}
                      title="Open category details"
                    >
                      {cat.ticketCategoryName}: {cat.forexPrice}
                    </button>
                  ))}
                  {cats.length > 4 && (
                    <span style={styles.more}>+{cats.length - 4} more</span>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
