import React, { useEffect, useMemo, useState } from 'react';
import PrinterService from '../services/PrinterService';
import BluetoothService from '../services/BluetoothService'; // NEW

export default function CategoryDetails({ token, event, category, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1'); // NEW: separate string state for free typing
  const [customerInfo, setCustomerInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const eventDateStr = useMemo(
    () => (event?.eventDate ? new Date(event.eventDate).toLocaleString() : ''),
    [event?.eventDate]
  );
  const loggedInUser = useMemo(() => localStorage.getItem('authUsername') || '', []);
  // New: tickets sold per event
  const soldKey = useMemo(() => (event?.id ? `ticketsSold_${event.id}` : 'ticketsSold_'), [event?.id]);
  const [ticketsSold, setTicketsSold] = useState(0);

  useEffect(() => {
    // Load persisted count
    try {
      const v = localStorage.getItem(soldKey);
      setTicketsSold(Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0);
    } catch {
      setTicketsSold(0);
    }
  }, [soldKey]);

  const persistTicketsSold = (val) => {
    setTicketsSold(val);
    try { localStorage.setItem(soldKey, String(val)); } catch {}
  };

  // Roll settings and derived values
  const ROLL_MAX = 10;
  const ROLL_WARN_THRESHOLD = 8;
  const remainingOnRoll = Math.max(0, ROLL_MAX - ticketsSold);

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

  // Theming (aligned with Home)
  const theme = {
    primary: '#00878a',
    accent: '#f39c12',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(0,135,138,0.35)'
  };

  const styles = {
    shell: { width: '96%', maxWidth: 1200 },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 },
    pageTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
    btnPrimary: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.primary}`, color: '#fff',
      background: theme.primary, cursor: 'pointer'
    },
    btnSecondary: {
      padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.accent}`, color: '#fff',
      background: 'transparent', cursor: 'pointer'
    },
    btnDanger: {
      padding: '8px 14px', borderRadius: 8, border: '1px solid #ff6961', color: '#fff',
      background: '#ff6961', cursor: 'pointer'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1.2fr 1fr',
      gap: 12
    },
    card: {
      background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
    },
    // New: large number style
    bigNumber: { fontSize: 28, fontWeight: 800, color: theme.accent },
    cardTitle: { fontWeight: 700, margin: 0, marginBottom: 8 },
    subtle: { fontSize: 12, opacity: 0.8 },
    input: {
      width: '95%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)',
        background: '#fff', color: '#111', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',marginBottom: '14px'
    },
    label: { display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6, marginTop: 10 },
    statusBox: (color) => ({
      border: `1px solid ${color}`, color, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.15)', marginTop: 12
    }),
    row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    pill: {
      display: 'inline-block', border: `1px solid ${theme.cardBorder}`, borderRadius: 999,
      padding: '4px 10px', fontSize: 12, marginRight: 6
    },
    amountRow: { marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `1px dashed ${theme.cardBorder}`, background: 'rgba(0,0,0,0.12)' },
    amountLabel: { fontSize: 12, opacity: 0.8, marginRight: 6 },
    amountValue: { fontWeight: 800, color: theme.accent },
    cardDanger: { background: 'rgba(255,0,0,0.10)', border: '1px solid rgba(255,0,0,0.6)' }
  };

  // NEW: track printer connection
  const [printerConnected, setPrinterConnected] = useState(false);
  useEffect(() => {
    const update = () => setPrinterConnected(!!BluetoothService.isConnected?.());
    update();
    let handler = () => setPrinterConnected(false);
    const dev = BluetoothService.getConnectedDevice?.();
    try { dev && dev.addEventListener('gattserverdisconnected', handler); } catch (_) {}
    const id = setInterval(update, 2000);
    return () => {
      try { dev && dev.removeEventListener('gattserverdisconnected', handler); } catch (_) {}
      clearInterval(id);
    };
  }, []);

  // Compute live amount to be paid
  const qtyPreview = Math.max(1, parseInt(quantityInput, 10) || 1);
  const priceNumber = useMemo(() => {
    const p = category?.price;
    if (p && typeof p === 'object' && p.parsedValue != null) return Number(p.parsedValue) || 0;
    return Number(p) || 0;
  }, [category?.price]);
  const amountToPay = (qtyPreview * priceNumber) || 0;
  const amountDisplay = useMemo(() => amountToPay.toFixed(2), [amountToPay]);

  // Change roll handler
  const handleChangeRoll = () => {
    if (busy) return;
    const ok = window.confirm('Change paper roll? This will reset the ticket counter for this roll.');
    if (ok) {
      persistTicketsSold(0);
      setMsg('Paper roll counter reset.');
    }
  };

  if (!event || !category) {
    return (
      <div style={styles.shell}>
        <div style={styles.headerRow}>
          <h3 style={styles.pageTitle}>Category Details</h3>
          <button onClick={onBack} style={styles.btnSecondary}>Back</button>
        </div>
        <div style={styles.card}>
          <div style={{ color: 'salmon' }}>Missing event/category. Go back and select again.</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    // If roll full, block
    if (ticketsSold >= ROLL_MAX) {
      setMsg('Paper roll full. Please change paper roll before selling.');
      setBusy(false);
      return;
    }

    // Normalize from input string (allowing edits), clamp min 1
    const qtyNum = Math.max(1, parseInt(quantityInput, 10) || 1);
    // Enforce remaining capacity on this roll
    if (qtyNum > remainingOnRoll) {
      setMsg(`Maximum allowed this roll is ${remainingOnRoll}. Reduce quantity or change paper roll.`);
      setBusy(false);
      return;
    }
    const qtyStr = String(qtyNum);
    if (qtyNum !== quantity) setQuantity(qtyNum);

    const priceStr = category?.price != null ? String(category.price) : '0';
    const forexPriceStr = (() => {
      const fp = category?.forexPrice;
      if (fp && typeof fp === 'object' && fp.parsedValue != null) return String(fp.parsedValue);
      if (fp != null) return String(fp);
      return '0';
    })();

    const payload = {
      selectedEventTicketCategoryList: [
        {
          buy: 0,
          eventDescription: event.description,
          forexPrice: forexPriceStr,
          getFree: 0,
          id: category.id,
          numberOfTickets: qtyStr,
          price: priceStr,
          qty: qtyStr,
          tempTicketCategoryId: category.id,
          ticketCategoryName: category.ticketCategoryName,
          ticketTemplateContent: '',
        },
      ],
      seatsChecked: [],
      loggedInUser,
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch('https://backendservices.clicknpay.africa/eticketservicestest/eventTicket/checkout/ClicknPay/richard@clicknpay.africa/0782428177/NOTALLIANCE/GATESALES', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      // Try JSON to extract ticket & qr
      let data = null;
      try {
        data = await resp.clone().json();
      } catch {
        const txt = await resp.text();
        if (!resp.ok) throw new Error(txt || `Request failed (${resp.status})`);
        setMsg(txt || 'Sale submitted successfully.');
        setBusy(false);
        return;
      }

      if (!resp.ok) {
        const errText = typeof data === 'string' ? data : JSON.stringify(data);
        throw new Error(errText || `Request failed (${resp.status})`);
      }

      setMsg('Sale submitted successfully.');

      // Extract ticket info
      const ticket = Array.isArray(data.ticketIds) && data.ticketIds.length > 0 ? data.ticketIds[0] : null;
      const qrText = ticket?.qrCode || '';
      const ticketId = ticket?.ticketId || '';
      const priceOut = category?.price != null ? String(category.price) : '0';
      const qtyOut = qtyStr;

      // Print receipt
      try {
        await PrinterService.printSaleReceipt({
          eventDescription: event.description,
          categoryName: category.ticketCategoryName,
          tellerEmail: loggedInUser || '',
          ticketId,
          price: priceOut,
          quantity: qtyOut,
          venueName: event.venueName || '',
          eventDateMs: event.eventDate,
          qrText
        });

        // Increment tickets sold and reset quantity inputs
        const inc = Math.max(0, parseInt(qtyOut, 10) || 0);
        if (inc > 0) persistTicketsSold(ticketsSold + inc);
        setQuantity(1);
        setQuantityInput('1');
      } catch (printErr) {
        setMsg(prev => (prev ? prev + ' | ' : '') + `Print failed: ${printErr.message}`);
      }
    } catch (err) {
      setMsg(err.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={styles.headerRow}>
        <h3 style={styles.pageTitle}>Category Details</h3>
        <button onClick={onBack} style={styles.btnSecondary}>Back</button>
      </div>

      {/* Content grid: Event summary + Form */}
      <div style={styles.grid}>
        {/* Event Summary Card */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Event Summary</h4>
          <div style={{ fontWeight: 700, marginBottom: 4, color: theme.accent }}>{event.description}</div>
          <div style={styles.subtle}>
            {eventDateStr} • {event.city || ''}{event.venueName ? ` • ${event.venueName}` : ''}
          </div>

          <div style={{ marginTop: 10 }}>
            <div><strong>Category:</strong> {category.ticketCategoryName}</div>
            <div><strong>Price:</strong> {category.price}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              Event ID: {event.id} • Category ID: {category.id}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={styles.pill}>Venue: {event.venueName || '-'}</span>
            <span style={styles.pill}>Type: {event.eventType || '-'}</span>
            <span style={styles.pill}>City: {event.city || '-'}</span>
          </div>
        </div>

        {/* Sale Form Card */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Sale</h4>

          {!printerConnected ? (
            <>
              <div className="subtle" style={styles.subtle}>Printer status: Not Connected</div>
              <div style={styles.statusBox('salmon')}>Printer not connected. Connect a printer before selling.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="button" onClick={onBack} style={styles.btnSecondary}>
                  Back
                </button>
              </div>
            </>
          ) : remainingOnRoll === 0 ? (
            <>
              <div className="subtle" style={styles.subtle}>Paper roll full (10/10).</div>
              <div style={styles.statusBox('salmon')}>Paper roll is full. Change paper roll to continue.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="button" onClick={handleChangeRoll} style={styles.btnDanger}>
                  Change Paper Roll
                </button>
                <button type="button" onClick={onBack} style={styles.btnSecondary}>
                  Back
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              {/* Amount to be paid */}
              <div style={styles.amountRow}>
                <span style={styles.amountLabel}>Amount to be paid:</span>
                <span style={styles.amountValue}>{amountDisplay}</span>
              </div>

              <label style={styles.label}>Quantity</label>
              <input
                type="text"
                min={1}
                step={1}
                value={quantityInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantityInput(val);
                  const n = parseInt(val, 10);
                  if (!Number.isNaN(n)) setQuantity(n);
                }}
                style={styles.input}
                required
              />
              <div className="subtle" style={styles.subtle}>Max allowed this roll: {remainingOnRoll}</div>

              {/* Optional customer info (currently omitted) */}
              {/* <label style={styles.label}>Customer Info</label>
              <input
                type="text"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
                style={styles.input}
                placeholder="Name, phone or email"
                required
              /> */}

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="submit" disabled={busy} style={styles.btnPrimary}>
                  {busy ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={onBack} style={styles.btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {msg && <div style={styles.statusBox(msg.toLowerCase().includes('failed') ? 'salmon' : theme.accent)}>{msg}</div>}
        </div>
      </div>

      {/* Sales Summary Card */}
      <div style={{ marginTop: 12 }}>
        <div style={{ ...styles.card, ...(ticketsSold >= ROLL_WARN_THRESHOLD ? styles.cardDanger : {}) }}>
          <h4 style={styles.cardTitle}>Sales Summary</h4>
          <div className="subtle" style={styles.subtle}>
            Tickets sold for this event (this device) • Max per roll: {ROLL_MAX} • Remaining: {remainingOnRoll}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={styles.bigNumber}>{ticketsSold}</span>
            {ticketsSold >= ROLL_WARN_THRESHOLD && (
              <button type="button" onClick={handleChangeRoll} style={styles.btnDanger}>
                Change Paper Roll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
