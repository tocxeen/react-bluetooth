import React, { useMemo, useState } from 'react';
import PrinterService from '../services/PrinterService';

export default function CategoryDetails({ token, event, category, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const eventDateStr = useMemo(
    () => (event?.eventDate ? new Date(event.eventDate).toLocaleString() : ''),
    [event?.eventDate]
  );
  const loggedInUser = useMemo(() => localStorage.getItem('authUsername') || '', []);

  if (!event || !category) {
    return (
      <div style={{ width: '95%', maxWidth: 800 }}>
        <h3 style={{ margin: 0 }}>Category Details</h3>
        <div style={{ marginTop: 10, color: 'salmon' }}>Missing event/category. Go back and select again.</div>
        <div style={{ marginTop: 12 }}>
          <button onClick={onBack} style={{ padding: '6px 12px' }}>Back</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    const qtyStr = String(quantity || 0);
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
      const priceStr = category?.price != null ? String(category.price) : '0';
      const qtyStr = String(quantity || 0);

      // Print receipt
      try {
        await PrinterService.printSaleReceipt({
          eventDescription: event.description,
          categoryName: category.ticketCategoryName,
          tellerEmail: loggedInUser || '',
          ticketId,
          price: priceStr,
          quantity: qtyStr,
          venueName: event.venueName || '',
          eventDateMs: event.eventDate,
          qrText
        });
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
    <div style={{ width: '95%', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Category Details</h3>
        <button onClick={onBack} style={{ padding: '6px 12px' }}>Back</button>
      </div>

      <div style={{ marginTop: 12, border: '1px solid #444', borderRadius: 6, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{event.description}</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
          {eventDateStr} • {event.city || ''} {event.venueName ? `• ${event.venueName}` : ''}
        </div>
        <div><strong>Category:</strong> {category.ticketCategoryName}</div>
        <div><strong>Price:</strong> {category.price}</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          Event ID: {event.id} • Category ID: {category.id}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 16, textAlign: 'left' }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
            style={{ width: '100%', maxWidth: 200, padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Customer Info</label>
          <input
            type="text"
            value={customerInfo}
            onChange={(e) => setCustomerInfo(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="Name, phone or email"
            required
          />
        </div>
        <button type="submit" disabled={busy} style={{ padding: '10px 16px', background: '#3a7', color: '#fff', border: 0 }}>
          {busy ? 'Submitting...' : 'Submit'}
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
