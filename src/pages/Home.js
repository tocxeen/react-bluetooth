import React, { useEffect, useState } from 'react';

export default function Home({ token, printer, onChangePrinter, onOpenCategory }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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
      setEvents(sorted);
    } catch (e) {
      setErr(e.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []); // on mount

  return (
    <div style={{ width: '95%', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Home</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchEvents} style={{ padding: '6px 12px' }} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Events'}
          </button>
          <button onClick={onChangePrinter} style={{ padding: '6px 12px' }}>
            Change Printer
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, padding: 10, border: '1px solid #444', borderRadius: 6 }}>
        <div><strong>Selected Printer:</strong> {printer ? `${printer.name || 'Unknown'} (${printer.id})` : 'None'}</div>
      </div>

      {err && <div style={{ color: 'salmon', marginTop: 10, border: '1px solid salmon', padding: 8 }}>{err}</div>}

      <div style={{ marginTop: 16 }}>
        <h4>Active Events</h4>
        {loading && <div style={{ opacity: 0.8 }}>Loading events...</div>}
        {!loading && events.length === 0 && <div style={{ opacity: 0.8 }}>No events available.</div>}
        <div style={{ maxHeight: '50vh', overflowY: 'auto', border: '1px solid #333', borderRadius: 6, padding: 10 }}>
          {events.map((ev) => (
            <div key={ev.id} style={{ padding: '10px 8px', borderBottom: '1px solid #333' }}>
              <div style={{ fontWeight: 700 }}>{ev.description}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {new Date(ev.eventDate).toLocaleString()} • {ev.city || ''} {ev.venueName ? `• ${ev.venueName}` : ''}
              </div>
              {Array.isArray(ev.eventTicketCategories) && ev.eventTicketCategories.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ev.eventTicketCategories.slice(0, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onOpenCategory && onOpenCategory(ev, cat)}
                      style={{ border: '1px solid #555', padding: '4px 8px', borderRadius: 4, fontSize: 12, background: 'transparent', color: '#fff', cursor: 'pointer' }}
                      title="Open category details"
                    >
                      {cat.ticketCategoryName}: {cat.price}
                    </button>
                  ))}
                  {ev.eventTicketCategories.length > 4 && (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>+{ev.eventTicketCategories.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
