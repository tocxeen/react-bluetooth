// import React, { useEffect, useMemo, useState } from 'react';
// import PrinterService from '../services/PrinterService';
// import BluetoothService from '../services/BluetoothService'; // NEW

// export default function CategoryDetails({ token, event, category, onBack }) {
//   const [quantity, setQuantity] = useState(1);
//   const [quantityInput, setQuantityInput] = useState('1'); // NEW: separate string state for free typing
//   const [customerInfo, setCustomerInfo] = useState('');
//   const [busy, setBusy] = useState(false);
//   const [msg, setMsg] = useState('');
//   const [lastBatch, setLastBatch] = useState(null);
//   const [reprintCount, setReprintCount] = useState(0);

//   const eventDateStr = useMemo(
//     () => (event?.eventDate ? new Date(event.eventDate).toLocaleString() : ''),
//     [event?.eventDate]
//   );
//   const loggedInUser = useMemo(() => localStorage.getItem('authUsername') || '', []);
//   // New: tickets sold per event
//   const soldKey = useMemo(() => (event?.id ? `ticketsSold_${event.id}` : 'ticketsSold_'), [event?.id]);
//   const [ticketsSold, setTicketsSold] = useState(0);

//   useEffect(() => {
//     // Load persisted count
//     try {
//       const v = localStorage.getItem(soldKey);
//       setTicketsSold(Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0);
//     } catch {
//       setTicketsSold(0);
//     }
//   }, [soldKey]);

//   useEffect(() => {
//     const username = localStorage.getItem('authUsername') || 'guest';
//     try {
//       const batch = JSON.parse(localStorage.getItem(`lastBatch_${username}`) || 'null');
//       setLastBatch(batch && Array.isArray(batch.tickets) ? batch : null);
//     } catch {
//       setLastBatch(null);
//     }

//     try {
//       const count = parseInt(localStorage.getItem(`reprintCount_${username}`) || '0', 10);
//       setReprintCount(Number.isFinite(count) ? count : 0);
//     } catch {
//       setReprintCount(0);
//     }
//   }, []);

//   const persistTicketsSold = (val) => {
//     setTicketsSold(val);
//     try { localStorage.setItem(soldKey, String(val)); } catch {}
//   };

//   const saveLastBatch = (batch) => {
//     const username = localStorage.getItem('authUsername') || 'guest';
//     try { localStorage.setItem(`lastBatch_${username}`, JSON.stringify(batch)); } catch {}
//     setLastBatch(batch);
//   };

//   const incrementReprintCount = (amount = 1) => {
//     const username = localStorage.getItem('authUsername') || 'guest';
//     const next = reprintCount + amount;
//     try { localStorage.setItem(`reprintCount_${username}`, String(next)); } catch {}
//     setReprintCount(next);
//   };

//   const promptReprintPin = () => {
//     const entered = window.prompt('Enter reprint PIN');
//     if (!entered) return null;
//     return entered.trim();
//   };

//   const handleReprintPreviousBatch = async () => {
//     if (!lastBatch || !Array.isArray(lastBatch.tickets) || lastBatch.tickets.length === 0) {
//       setMsg('No previous batch available to reprint.');
//       return;
//     }

//     const pin = promptReprintPin();
//     if (!pin) {
//       setMsg('Reprint canceled.');
//       return;
//     }
//     if (pin !== '400290') {
//       setMsg('Invalid PIN. Reprint aborted.');
//       return;
//     }

//     if (!printerConnected) {
//       setMsg('Printer not connected. Connect a printer before reprinting.');
//       return;
//     }

//     setBusy(true);
//     setMsg('Reprinting previous batch...');
//     const tickets = Array.isArray(lastBatch.tickets) ? lastBatch.tickets : [];
//     let printedCount = 0;

//     try {
//       for (const item of tickets) {
//         try {
//           await printCustomerReceipt({
//             ticketId: item.ticketId,
//             qrText: item.qrText,
//             priceStr: item.priceStr
//           });
//           printedCount += 1;
//           await new Promise((r) => setTimeout(r, 120));
//         } catch (err) {
//           console.error('Customer reprint failed for ticket', item, err);
//         }
//       }

//       for (const item of tickets) {
//         try {
//           await printTellerCopy({
//             ticketId: item.ticketId,
//             priceStr: item.priceStr
//           });
//           await new Promise((r) => setTimeout(r, 120));
//         } catch (err) {
//           console.error('Teller copy reprint failed for ticket', item, err);
//         }
//       }

//       if (printedCount > 0) {
//         incrementReprintCount(printedCount);
//         setMsg(`Reprinted ${printedCount} ticket(s) from previous batch.`);
//       } else {
//         setMsg('Reprint completed, but no tickets were printed successfully.');
//       }
//     } finally {
//       setBusy(false);
//     }
//   };

//   // Roll settings and derived values
//   const ROLL_MAX = 60;
//   const ROLL_WARN_THRESHOLD = ROLL_MAX - 2;
//   const remainingOnRoll = Math.max(0, ROLL_MAX - ticketsSold);

//   // Responsive breakpoints
//   const [isMobile, setIsMobile] = useState(false);
//   const [isTablet, setIsTablet] = useState(false);
//   useEffect(() => {
//     const onResize = () => {
//       const w = window.innerWidth;
//       setIsMobile(w <= 640);
//       setIsTablet(w > 640 && w <= 1024);
//     };
//     onResize();
//     window.addEventListener('resize', onResize);
//     return () => window.removeEventListener('resize', onResize);
//   }, []);

//   // Theming (aligned with Home)
//   const theme = {
//     primary: '#00878a',
//     accent: '#f39c12',
//     cardBg: 'rgba(255,255,255,0.05)',
//     cardBorder: 'rgba(0,135,138,0.35)'
//   };

//   const styles = {
//     shell: { width: '96%', maxWidth: 1200 },
//     headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 },
//     pageTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
//     btnPrimary: {
//       padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.primary}`, color: '#fff',
//       background: theme.primary, cursor: 'pointer'
//     },
//     btnSecondary: {
//       padding: '8px 14px', borderRadius: 8, border: `1px solid ${theme.accent}`, color: '#fff',
//       background: 'transparent', cursor: 'pointer'
//     },
//     btnDanger: {
//       padding: '8px 14px', borderRadius: 8, border: '1px solid #ff6961', color: '#fff',
//       background: '#ff6961', cursor: 'pointer'
//     },
//     grid: {
//       display: 'grid',
//       gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1.2fr 1fr',
//       gap: 12
//     },
//     card: {
//       background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: 14
//     },
//     // New: large number style
//     bigNumber: { fontSize: 28, fontWeight: 800, color: theme.accent },
//     cardTitle: { fontWeight: 700, margin: 0, marginBottom: 8 },
//     subtle: { fontSize: 12, opacity: 0.8 },
//     input: {
//       width: '95%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)',
//         background: '#fff', color: '#111', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',marginBottom: '14px'
//     },
//     label: { display: 'block', fontSize: 12, opacity: 0.8, marginBottom: 6, marginTop: 10 },
//     statusBox: (color) => ({
//       border: `1px solid ${color}`, color, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.15)', marginTop: 12
//     }),
//     row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
//     pill: {
//       display: 'inline-block', border: `1px solid ${theme.cardBorder}`, borderRadius: 999,
//       padding: '4px 10px', fontSize: 12, marginRight: 6
//     },
//     amountRow: { marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `1px dashed ${theme.cardBorder}`, background: 'rgba(0,0,0,0.12)' },
//     amountLabel: { fontSize: 12, opacity: 0.8, marginRight: 6 },
//     amountValue: { fontWeight: 800, color: theme.accent },
//     cardDanger: { background: 'rgba(255,0,0,0.10)', border: '1px solid rgba(255,0,0,0.6)' }
//   };

//   // NEW: track printer connection
//   const [printerConnected, setPrinterConnected] = useState(false);
//   useEffect(() => {
//     const update = () => setPrinterConnected(!!BluetoothService.isConnected?.());
//     update();
//     let handler = () => setPrinterConnected(false);
//     const dev = BluetoothService.getConnectedDevice?.();
//     try { dev && dev.addEventListener('gattserverdisconnected', handler); } catch (_) {}
//     const id = setInterval(update, 2000);
//     return () => {
//       try { dev && dev.removeEventListener('gattserverdisconnected', handler); } catch (_) {}
//       clearInterval(id);
//     };
//   }, []);

//   // Compute live amount to be paid
//   const qtyPreview = Math.max(1, parseInt(quantityInput, 10) || 1);
//   const priceNumber = useMemo(() => {
//     const p = category?.price;
//     if (p && typeof p === 'object' && p.parsedValue != null) return Number(p.parsedValue) || 0;
//     return Number(p) || 0;
//   }, [category?.price]);
//   const amountToPay = (qtyPreview * priceNumber) || 0;
//   const amountDisplay = useMemo(() => amountToPay.toFixed(2), [amountToPay]);

//   // Change roll handler
//   const handleChangeRoll = () => {
//     if (busy) return;
//     const ok = window.confirm('Change paper roll? This will reset the ticket counter for this roll.');
//     if (ok) {
//       persistTicketsSold(0);
//       setMsg('Paper roll counter reset.');
//     }
//   };

//   if (!event || !category) {
//     return (
//       <div style={styles.shell}>
//         <div style={styles.headerRow}>
//           <h3 style={styles.pageTitle}>Category Details</h3>
//           <button onClick={onBack} style={styles.btnSecondary}>Back</button>
//         </div>
//         <div style={styles.card}>
//           <div style={{ color: 'salmon' }}>Missing event/category. Go back and select again.</div>
//         </div>
//       </div>
//     );
//   }

//     // Helper: print only the customer receipt (with QR)
//     const printCustomerReceipt = async ({ ticketId, qrText, priceStr }) => {
//       const c = PrinterService.getESCPOSCommands();
//       await PrinterService.sendCommand(c.INIT);
//       await PrinterService.sendCommand(c.ALIGN_CENTER);
//       await PrinterService.sendCommand(c.BOLD_ON);
//       await PrinterService.sendText('ClicknPay POS\n');
//       await PrinterService.sendCommand(c.BOLD_OFF);

//       if (event?.description) await PrinterService.sendText(`${event.description}\n`);

//       await PrinterService.sendCommand(c.ALIGN_LEFT);
//       if (category?.ticketCategoryName) await PrinterService.sendText(`Event Category: ${category.ticketCategoryName}\n`);
//       const tellerEmail = localStorage.getItem('authUsername') || '';
//       if (tellerEmail) await PrinterService.sendText(`Teller: ${tellerEmail}\n`);
//       if (ticketId) await PrinterService.sendText(`Ticket#: ${ticketId}\n`);
//       if (priceStr) await PrinterService.sendText(`Price: ${priceStr}\n`);
//       await PrinterService.sendText(`Quantity: 1\n`);
//       if (event?.venueName) await PrinterService.sendText(`Venue: ${event.venueName}\n`);
//       if (event?.eventDate) await PrinterService.sendText(`Date & Time: ${new Date(event.eventDate).toLocaleString()}\n`);

//       await PrinterService.sendCommand(c.ALIGN_CENTER);
//       if (qrText) await PrinterService.printQRCode(qrText, { size: 6, errorCorrection: 'M' });

//       await PrinterService.sendText('---------------------------------\n');
//       await PrinterService.sendText('Thank you for using Clicknpay.\n');
//       // Remove extra feed to reduce trailing space
//       // await PrinterService.sendCommand(c.LINE_FEED);
//       try { await PrinterService.sendCommand(c.CUT_PAPER); } catch {}
//     };

//     // Helper: print only the teller copy (no QR)
//     const printTellerCopy = async ({ ticketId, priceStr }) => {
//       const c = PrinterService.getESCPOSCommands();
//       await PrinterService.sendCommand(c.INIT);
//       await PrinterService.sendCommand(c.ALIGN_CENTER);
//       await PrinterService.sendCommand(c.BOLD_ON);
//       await PrinterService.sendText('Teller Copy\n');
//       await PrinterService.sendCommand(c.BOLD_OFF);

//       await PrinterService.sendCommand(c.ALIGN_LEFT);
//       if (ticketId) await PrinterService.sendText(`Ticket Id: ${ticketId}\n`);
//       if (category?.ticketCategoryName) await PrinterService.sendText(`Category: ${category.ticketCategoryName}\n`);
//       if (priceStr) await PrinterService.sendText(`Price: ${priceStr}\n`);
//       if (event?.eventDate) await PrinterService.sendText(`Date & Time: ${new Date(event.eventDate).toLocaleString()}\n`);
//       const tellerEmail = localStorage.getItem('authUsername') || '';
//       if (tellerEmail) await PrinterService.sendText(`Teller: ${tellerEmail}\n`);
//       await PrinterService.sendText(`Quantity: 1\n`);

//       // Remove extra feed to reduce trailing space
//       // await PrinterService.sendCommand(c.LINE_FEED);
//       try { await PrinterService.sendCommand(c.CUT_PAPER); } catch {}
//     };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setBusy(true);
//     setMsg('');

//     // If roll full, block
//     if (ticketsSold >= ROLL_MAX) {
//         setMsg('Paper roll full. Please change paper roll before selling.');
//         setBusy(false);
//         return;
//     }

//     // Normalize from input string (allowing edits), clamp min 1
//     const qtyNum = Math.max(1, parseInt(quantityInput, 10) || 1);
//     // Enforce remaining capacity on this roll
//     if (qtyNum > remainingOnRoll) {
//         setMsg(`Maximum allowed this roll is ${remainingOnRoll}. Reduce quantity or change paper roll.`);
//         setBusy(false);
//         return;
//     }
//     const qtyStr = String(qtyNum);
//     if (qtyNum !== quantity) setQuantity(qtyNum);

//     const priceStr = category?.price != null ? String(category.price) : '0';
//     const forexPriceStr = (() => {
//         const fp = category?.forexPrice;
//         if (fp && typeof fp === 'object' && fp.parsedValue != null) return String(fp.parsedValue);
//         if (fp != null) return String(fp);
//         return '0';
//     })();

//     // Build payload per ticket: qty=1, numberOfTickets=1
//     const makePayloadOnce = () => ({
//       selectedEventTicketCategoryList: [
//         {
//           buy: 0,
//           eventDescription: event.description,
//           forexPrice: forexPriceStr,
//           getFree: 0,
//           id: category.id,
//           numberOfTickets: '1',
//           price: priceStr,
//           qty: '1',
//           tempTicketCategoryId: category.id,
//           ticketCategoryName: category.ticketCategoryName,
//           ticketTemplateContent: '',
//         },
//       ],
//       seatsChecked: [],
//       loggedInUser,
//     });

//     const headers = { 'Content-Type': 'application/json' };
//     if (token) headers['Authorization'] = `Bearer ${token}`;
//     const tellerEmail = localStorage.getItem('authUsername') || '';
//     const endpoint = `https://backendservices.clicknpay.africa/eticketservices/eventTicket/checkout/ClicknPay/${tellerEmail}/0775402193/NOTALLIANCE/GATESALES`;

//     let successCount = 0;
//     let failureCount = 0;
//     const startSold = ticketsSold;
//     const successes = []; // collect successful ticket data for teller copies

//     for (let i = 0; i < qtyNum; i++) {
//       const currentRemaining = Math.max(0, ROLL_MAX - (startSold + successCount));
//       if (currentRemaining <= 0) {
//         failureCount += (qtyNum - i);
//         break;
//       }

//       try {
//         setMsg(`Processing ${i + 1}/${qtyNum}...`);
//         const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(makePayloadOnce()) });

//         // Parse
//         let data = null;
//         try {
//           data = await resp.clone().json();
          
//         } catch {
//           const txt = await resp.text();
//           if (!resp.ok) throw new Error(txt || `Request failed (${resp.status})`);
//           data = {};
//         }
//         if (!resp.ok) {
//           const errText = typeof data === 'string' ? data : JSON.stringify(data);
//           throw new Error(errText || `Request failed (${resp.status})`);
//         }

//         // Extract and print customer receipt now
//         const ticket = Array.isArray(data.ticketIds) && data.ticketIds.length > 0 ? data.ticketIds[0] : null;
//         const qrText = ticket?.qrCode || '';
//         const ticketId = ticket?.ticketId || '';

//         try {
//           await printCustomerReceipt({ ticketId, qrText, priceStr });
//           successCount += 1;
//           successes.push({ ticketId, qrText, priceStr }); // store for teller copies and reprint
//         } catch {
//           failureCount += 1;
//         }
//       } catch {
//         failureCount += 1;
//       }
//     }

//     // After all customer receipts, print teller copies (no QR)
//     for (const t of successes) {
//       try {
//         await printTellerCopy(t);
//       } catch {
//         // ignore individual teller copy failures in summary, optional: collect stats
//       }
//       await new Promise(r => setTimeout(r, 120));
//     }

//     // Update roll counter based on successful customer prints only
//     if (successCount > 0) {
//       persistTicketsSold(startSold + successCount);
//       saveLastBatch({
//         eventId: String(event.id),
//         categoryId: String(category.id),
//         tickets: successes.map((ticket) => ({
//           ticketId: ticket.ticketId || '',
//           qrText: ticket.qrText || '',
//           priceStr: ticket.priceStr || ''
//         })),
//         timestamp: Date.now()
//       });
//     }

//     // Reset
//     setQuantity(1);
//     setQuantityInput('1');

//     // Summary
//     if (failureCount === 0) setMsg(`Sale submitted successfully. Printed ${successCount} ticket(s) + ${successes.length} teller copy(ies).`);
//     else if (successCount === 0) setMsg('No tickets were printed. Please try again.');
//     else setMsg(`Printed ${successCount} ticket(s), ${failureCount} failed. Teller copies attempted: ${successes.length}.`);

//     setBusy(false);
//   };

//   return (
//     <div style={styles.shell}>
//       {/* Header */}
//       <div style={styles.headerRow}>
//         <h3 style={styles.pageTitle}>Category Details</h3>
//         <button onClick={onBack} style={styles.btnSecondary}>Back</button>
//       </div>

//       {/* Content grid: Event summary + Form */}
//       <div style={styles.grid}>
//         {/* Event Summary Card */}
//         <div style={styles.card}>
//           <h4 style={styles.cardTitle}>Event Summary</h4>
//           <div style={{ fontWeight: 700, marginBottom: 4, color: theme.accent }}>{event.description}</div>
//           <div style={styles.subtle}>
//             {eventDateStr} • {event.city || ''}{event.venueName ? ` • ${event.venueName}` : ''}
//           </div>

//           <div style={{ marginTop: 10 }}>
//             <div><strong>Category:</strong> {category.ticketCategoryName}</div>
//             <div><strong>Price:</strong> {category.forexPrice}</div>
//             <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
//               Event ID: {event.id} • Category ID: {category.id}
//             </div>
//           </div>

//           <div style={{ marginTop: 12 }}>
//             <span style={styles.pill}>Venue: {event.venueName || '-'}</span>
//             <span style={styles.pill}>Type: {event.eventType || '-'}</span>
//             <span style={styles.pill}>City: {event.city || '-'}</span>
//           </div>
//         </div>

//         {/* Sale Form Card */}
//         <div style={styles.card}>
//           <h4 style={styles.cardTitle}>Sale</h4>

//           {!printerConnected ? (
//             <>
//               <div className="subtle" style={styles.subtle}>Printer status: Not Connected</div>
//               <div style={styles.statusBox('salmon')}>Printer not connected. Connect a printer before selling.</div>
//               <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
//                 <button type="button" onClick={onBack} style={styles.btnSecondary}>
//                   Back
//                 </button>
//               </div>
//             </>
//           ) : remainingOnRoll === 0 ? (
//             <>
//               <div className="subtle" style={styles.subtle}>Paper roll full ({ROLL_MAX}/{ROLL_MAX}).</div>
//               <div style={styles.statusBox('salmon')}>Paper roll is full. Change paper roll to continue.</div>
//               <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
//                 <button type="button" onClick={handleChangeRoll} style={styles.btnDanger}>
//                   Change Paper Roll
//                 </button>
//                 <button type="button" onClick={onBack} style={styles.btnSecondary}>
//                   Back
//                 </button>
//               </div>
//             </>
//           ) : (
//             <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
//               {/* Amount to be paid */}
//               <div style={styles.amountRow}>
//                 <span style={styles.amountLabel}>Amount to be paid:</span>
//                 <span style={styles.amountValue}>{amountDisplay}</span>
//               </div>

//               <label style={styles.label}>Quantity</label>
//               <input
//                 type="text"
//                 min={1}
//                 step={1}
//                 value={quantityInput}
//                 onChange={(e) => {
//                   const val = e.target.value;
//                   setQuantityInput(val);
//                   const n = parseInt(val, 10);
//                   if (!Number.isNaN(n)) setQuantity(n);
//                 }}
//                 style={styles.input}
//                 required
//               />
//               <div className="subtle" style={styles.subtle}>Max allowed this roll: {remainingOnRoll}</div>

//               {/* Optional customer info (currently omitted) */}
//               {/* <label style={styles.label}>Customer Info</label>
//               <input
//                 type="text"
//                 value={customerInfo}
//                 onChange={(e) => setCustomerInfo(e.target.value)}
//                 style={styles.input}
//                 placeholder="Name, phone or email"
//                 required
//               /> */}

//               <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
//                 <button type="submit" disabled={busy} style={styles.btnPrimary}>
//                   {busy ? 'Submitting…' : 'Submit'}
//                 </button>
//                 <button type="button" onClick={onBack} style={styles.btnSecondary}>
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleReprintPreviousBatch}
//                   disabled={busy || !lastBatch || lastBatch.tickets?.length === 0}
//                   style={{
//                     ...styles.btnSecondary,
//                     borderColor: '#4a90e2',
//                     color: '#fff',
//                     background: lastBatch ? '#4a90e2' : 'rgba(74,144,226,0.25)'
//                   }}
//                 >
//                   Reprint Previous Batch
//                 </button>
//               </div>
//             </form>
//           )}

//           {msg && <div style={styles.statusBox(msg.toLowerCase().includes('failed') ? 'salmon' : theme.accent)}>{msg}</div>}
//         </div>
//       </div>

//       {/* Reprint Summary Card */}
//       <div style={{ marginTop: 12 }}>
//         <div style={styles.card}>
//           <h4 style={styles.cardTitle}>Batch Reprint</h4>
//           <div style={styles.subtle}>
//             {lastBatch && lastBatch.tickets?.length > 0
//               ? `Last batch contains ${lastBatch.tickets.length} ticket(s). Reprints: ${reprintCount}.`
//               : 'No previous batch available. Complete a sale first to enable reprint.'}
//           </div>
//           {lastBatch?.tickets?.length > 0 && (
//             <div style={{ marginTop: 8 }}>
//               <div style={styles.pill}>Event ID: {lastBatch.eventId}</div>
//               <div style={styles.pill}>Category ID: {lastBatch.categoryId}</div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Sales Summary Card */}
//       <div style={{ marginTop: 12 }}>
//         <div style={{ ...styles.card, ...(ticketsSold >= ROLL_WARN_THRESHOLD ? styles.cardDanger : {}) }}>
//           <h4 style={styles.cardTitle}>Sales Summary</h4>
//           <div className="subtle" style={styles.subtle}>
//             Tickets sold for this event (this device) • Max per roll: {ROLL_MAX} • Remaining: {remainingOnRoll}
//           </div>
//           <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
//             <span style={styles.bigNumber}>{ticketsSold}</span>
//             {ticketsSold >= ROLL_WARN_THRESHOLD && (
//               <button type="button" onClick={handleChangeRoll} style={styles.btnDanger}>
//                 Change Paper Roll
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from 'react';
import PrinterService from '../services/PrinterService';
import BluetoothService from '../services/BluetoothService'; // NEW

export default function CategoryDetails({ token, event, category, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1'); // NEW: separate string state for free typing
  const [customerInfo, setCustomerInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [lastBatch, setLastBatch] = useState(null);
  const [reprintCount, setReprintCount] = useState(0);

  const eventDateStr = useMemo(
    () => (event?.eventDate ? new Date(event.eventDate).toLocaleString() : ''),
    [event?.eventDate]
  );
  const loggedInUser = useMemo(() => localStorage.getItem('authUsername') || '', []);
  const cashierEmail = loggedInUser; // NEW: alias for clarity in reprint-authorization flows

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

  useEffect(() => {
    const username = localStorage.getItem('authUsername') || 'guest';
    try {
      const batch = JSON.parse(localStorage.getItem(`lastBatch_${username}`) || 'null');
      setLastBatch(batch && Array.isArray(batch.tickets) ? batch : null);
    } catch {
      setLastBatch(null);
    }

    try {
      const count = parseInt(localStorage.getItem(`reprintCount_${username}`) || '0', 10);
      setReprintCount(Number.isFinite(count) ? count : 0);
    } catch {
      setReprintCount(0);
    }
  }, []);

  const persistTicketsSold = (val) => {
    setTicketsSold(val);
    try { localStorage.setItem(soldKey, String(val)); } catch {}
  };

  const saveLastBatch = (batch) => {
    const username = localStorage.getItem('authUsername') || 'guest';
    try { localStorage.setItem(`lastBatch_${username}`, JSON.stringify(batch)); } catch {}
    setLastBatch(batch);
  };

  const incrementReprintCount = (amount = 1) => {
    const username = localStorage.getItem('authUsername') || 'guest';
    const next = reprintCount + amount;
    try { localStorage.setItem(`reprintCount_${username}`, String(next)); } catch {}
    setReprintCount(next);
  };

  // ===== NEW: Admin - request approval code via email =====
  const [adminEmail, setAdminEmail] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  // ===== NEW: Reprint authorization (approver email + code) =====
  const [reprintAuthOpen, setReprintAuthOpen] = useState(false);
  const [approverEmail, setApproverEmail] = useState('');
  const [approverCode, setApproverCode] = useState('');
  const [reprintAuthBusy, setReprintAuthBusy] = useState(false);
  const [reprintAuthMsg, setReprintAuthMsg] = useState('');

  const handleRequestCode = async () => {
    const email = (adminEmail || '').trim();
    if (!email) {
      setAdminMsg('Enter an email address to request a code.');
      return;
    }
    setAdminBusy(true);
    setAdminMsg('Requesting code...');
    try {
      const resp = await fetch('https://backendservices.clicknpay.africa/eticketservices/eventTicket/set-code?email='+email, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization':`Bearer ${token}`
        },
        
        
        // body: JSON.stringify(email)
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Request failed (${resp.status})`);
      }
      setAdminMsg(`Code requested. Check ${email} for the approval code.`);
      setApproverEmail(email); // prefill approver field for convenience
    } catch (err) {
      setAdminMsg(err.message || 'Failed to request code.');
    } finally {
      setAdminBusy(false);
    }
  };

  const openReprintAuth = () => {
    if (!lastBatch || !Array.isArray(lastBatch.tickets) || lastBatch.tickets.length === 0) {
      setMsg('No previous batch available to reprint.');
      return;
    }
    if (!printerConnected) {
      setMsg('Printer not connected. Connect a printer before reprinting.');
      return;
    }
    setApproverCode('');
    setReprintAuthMsg('');
    setReprintAuthOpen(true);
  };

  const cancelReprintAuth = () => {
    if (reprintAuthBusy) return;
    setReprintAuthOpen(false);
    setReprintAuthMsg('');
  };

  // Actual physical reprint (customer receipts + teller copies) - runs after authorization succeeds
  const doPhysicalReprint = async (tickets) => {
    setBusy(true);
    setMsg('Reprinting previous batch...');
    let printedCount = 0;

    try {
      for (const item of tickets) {
        try {
          await printCustomerReceipt({
            ticketId: item.ticketId,
            qrText: item.qrText,
            priceStr: item.priceStr
          });
          printedCount += 1;
          await new Promise((r) => setTimeout(r, 120));
        } catch (err) {
          console.error('Customer reprint failed for ticket', item, err);
        }
      }

      for (const item of tickets) {
        try {
          await printTellerCopy({
            ticketId: item.ticketId,
            priceStr: item.priceStr
          });
          await new Promise((r) => setTimeout(r, 120));
        } catch (err) {
          console.error('Teller copy reprint failed for ticket', item, err);
        }
      }

      if (printedCount > 0) {
        incrementReprintCount(printedCount);
        setMsg(`Reprinted ${printedCount} ticket(s) from previous batch.`);
      } else {
        setMsg('Reprint completed, but no tickets were printed successfully.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAuthorizeAndReprint = async () => {
    const approver = (approverEmail || '').trim();
    const code = (approverCode || '').trim();

    if (!approver) {
      setReprintAuthMsg('Enter the approver email.');
      return;
    }
    if (!code) {
      setReprintAuthMsg('Enter the code sent to the approver.');
      return;
    }
    if (!lastBatch || !Array.isArray(lastBatch.tickets) || lastBatch.tickets.length === 0) {
      setReprintAuthMsg('No previous batch available to reprint.');
      return;
    }

    const ticketIds = lastBatch.tickets
      .map((t) => {
        const n = parseInt(t.ticketId, 10);
        return Number.isFinite(n) ? n : t.ticketId;
      })
      .filter((id) => id !== '' && id != null);

    if (ticketIds.length === 0) {
      setReprintAuthMsg('No ticket IDs available in the last batch.');
      return;
    }

    setReprintAuthBusy(true);
    setReprintAuthMsg('Verifying code...');

    try {
      const resp = await fetch('https://backendservices.clicknpay.africa/eticketservices/eventTicket/reprint', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization':`Bearer ${token}`
        },
        body: JSON.stringify({
          approverEmail: approver,
          cashierEmail,
          code,
          ticketIds
        })
      });

      let data = null;
      try { data = await resp.clone().json(); } catch {}

      if (!resp.ok) {
        const errText =
          (data && (data.message || data.error)) ||
          (typeof data === 'string' ? data : '') ||
          `Authorization failed (${resp.status})`;
        throw new Error(errText);
      }

      setReprintAuthMsg('Authorized.');
      setReprintAuthOpen(false);
      const ticketsToPrint = lastBatch.tickets;
      await doPhysicalReprint(ticketsToPrint);
    } catch (err) {
      setReprintAuthMsg(err.message || 'Authorization failed. Reprint aborted.');
    } finally {
      setReprintAuthBusy(false);
    }
  };

  // ===== NEW: Cashier - view own reprints =====
  const [myReprints, setMyReprints] = useState([]);
  const [myReprintsBusy, setMyReprintsBusy] = useState(false);
  const [myReprintsMsg, setMyReprintsMsg] = useState('');

  const handleLoadMyReprints = async () => {
    if (!cashierEmail) {
      setMyReprintsMsg('No logged-in cashier email found.');
      return;
    }
    setMyReprintsBusy(true);
    setMyReprintsMsg('Loading...');
    try {
      const resp = await fetch(
        `https://backendservices.clicknpay.africa/eticketservices/eventTicket/cashier-reprinted?email=${encodeURIComponent(cashierEmail)}`,
        { headers: { Accept: 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Failed to load (${resp.status})`);
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : [];
      setMyReprints(list);
      setMyReprintsMsg(`Loaded ${list.length} record(s).`);
    } catch (err) {
      setMyReprints([]);
      setMyReprintsMsg(err.message || 'Failed to load reprints.');
    } finally {
      setMyReprintsBusy(false);
    }
  };

  // ===== NEW: Supervisor - view reprints they approved =====
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorReprints, setSupervisorReprints] = useState([]);
  const [supervisorBusy, setSupervisorBusy] = useState(false);
  const [supervisorMsg, setSupervisorMsg] = useState('');

  const handleLoadSupervisorReprints = async () => {
    const email = (supervisorEmail || '').trim();
    if (!email) {
      setSupervisorMsg('Enter a supervisor email.');
      return;
    }
    setSupervisorBusy(true);
    setSupervisorMsg('Loading...');
    try {
      const resp = await fetch(
        `https://backendservices.clicknpay.africa/eticketservices/eventTicket/supervisor-reprinted?email=${encodeURIComponent(email)}`,
        { headers: { Accept: 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || `Failed to load (${resp.status})`);
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : [];
      setSupervisorReprints(list);
      setSupervisorMsg(`Loaded ${list.length} record(s).`);
    } catch (err) {
      setSupervisorReprints([]);
      setSupervisorMsg(err.message || 'Failed to load reprints.');
    } finally {
      setSupervisorBusy(false);
    }
  };

  // ===== NEW: CSV export helper (shared by cashier & supervisor reports) =====
  const downloadReprintsCSV = (filename, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const headers = ['approverEmail', 'cashierEmail', 'code', 'ticketIds'];
    const escapeCell = (val) => {
      const s = val == null ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const ticketIds = Array.isArray(r.ticketIds) ? r.ticketIds.join('|') : (r.ticketIds ?? '');
      lines.push([
        escapeCell(r.approverEmail),
        escapeCell(r.cashierEmail),
        escapeCell(r.code),
        escapeCell(ticketIds)
      ].join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Roll settings and derived values
  const ROLL_MAX = 60;
  const ROLL_WARN_THRESHOLD = ROLL_MAX - 2;
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
    cardDanger: { background: 'rgba(255,0,0,0.10)', border: '1px solid rgba(255,0,0,0.6)' },

    // NEW: inline form row (label + input + button)
    inlineForm: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 8 },
    inlineField: { display: 'flex', flexDirection: 'column', flex: '1 1 220px', minWidth: 200 },
    inlineInput: {
      padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)',
      background: '#fff', color: '#111', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
    },

    // NEW: modal for reprint authorization
    modalOverlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modalPanel: {
      background: '#1e1e1e', color: '#fff', border: `1px solid ${theme.cardBorder}`, borderRadius: 8,
      width: '90%', maxWidth: 460, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', textAlign: 'left'
    },
    modalHeader: { padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}` },
    modalBody: { padding: 16 },
    modalFooter: { padding: 16, borderTop: `1px solid ${theme.cardBorder}`, textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' },

    // NEW: simple table for reprint reports
    tableWrap: { overflowX: 'auto', marginTop: 10 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${theme.cardBorder}`, opacity: 0.8, whiteSpace: 'nowrap' },
    td: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', wordBreak: 'break-word' }
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

    // Helper: print only the customer receipt (with QR)
    const printCustomerReceipt = async ({ ticketId, qrText, priceStr }) => {
      const c = PrinterService.getESCPOSCommands();
      await PrinterService.sendCommand(c.INIT);
      await PrinterService.sendCommand(c.ALIGN_CENTER);
      await PrinterService.sendCommand(c.BOLD_ON);
      await PrinterService.sendText('ClicknPay POS\n');
      await PrinterService.sendCommand(c.BOLD_OFF);

      if (event?.description) await PrinterService.sendText(`${event.description}\n`);

      await PrinterService.sendCommand(c.ALIGN_LEFT);
      if (category?.ticketCategoryName) await PrinterService.sendText(`Event Category: ${category.ticketCategoryName}\n`);
      const tellerEmail = localStorage.getItem('authUsername') || '';
      if (tellerEmail) await PrinterService.sendText(`Teller: ${tellerEmail}\n`);
      if (ticketId) await PrinterService.sendText(`Ticket#: ${ticketId}\n`);
      if (priceStr) await PrinterService.sendText(`Price: ${priceStr}\n`);
      await PrinterService.sendText(`Quantity: 1\n`);
      if (event?.venueName) await PrinterService.sendText(`Venue: ${event.venueName}\n`);
      if (event?.eventDate) await PrinterService.sendText(`Date & Time: ${new Date(event.eventDate).toLocaleString()}\n`);

      await PrinterService.sendCommand(c.ALIGN_CENTER);
      if (qrText) await PrinterService.printQRCode(qrText, { size: 6, errorCorrection: 'M' });

      await PrinterService.sendText('---------------------------------\n');
      await PrinterService.sendText('Thank you for using Clicknpay.\n');
      // Remove extra feed to reduce trailing space
      // await PrinterService.sendCommand(c.LINE_FEED);
      try { await PrinterService.sendCommand(c.CUT_PAPER); } catch {}
    };

    // Helper: print only the teller copy (no QR)
    const printTellerCopy = async ({ ticketId, priceStr }) => {
      const c = PrinterService.getESCPOSCommands();
      await PrinterService.sendCommand(c.INIT);
      await PrinterService.sendCommand(c.ALIGN_CENTER);
      await PrinterService.sendCommand(c.BOLD_ON);
      await PrinterService.sendText('Teller Copy\n');
      await PrinterService.sendCommand(c.BOLD_OFF);

      await PrinterService.sendCommand(c.ALIGN_LEFT);
      if (ticketId) await PrinterService.sendText(`Ticket Id: ${ticketId}\n`);
      if (category?.ticketCategoryName) await PrinterService.sendText(`Category: ${category.ticketCategoryName}\n`);
      if (priceStr) await PrinterService.sendText(`Price: ${priceStr}\n`);
      if (event?.eventDate) await PrinterService.sendText(`Date & Time: ${new Date(event.eventDate).toLocaleString()}\n`);
      const tellerEmail = localStorage.getItem('authUsername') || '';
      if (tellerEmail) await PrinterService.sendText(`Teller: ${tellerEmail}\n`);
      await PrinterService.sendText(`Quantity: 1\n`);

      // Remove extra feed to reduce trailing space
      // await PrinterService.sendCommand(c.LINE_FEED);
      try { await PrinterService.sendCommand(c.CUT_PAPER); } catch {}
    };

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

    // Build payload per ticket: qty=1, numberOfTickets=1
    const makePayloadOnce = () => ({
      selectedEventTicketCategoryList: [
        {
          buy: 0,
          eventDescription: event.description,
          forexPrice: forexPriceStr,
          getFree: 0,
          id: category.id,
          numberOfTickets: '1',
          price: priceStr,
          qty: '1',
          tempTicketCategoryId: category.id,
          ticketCategoryName: category.ticketCategoryName,
          ticketTemplateContent: '',
        },
      ],
      seatsChecked: [],
      loggedInUser,
    });

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const tellerEmail = localStorage.getItem('authUsername') || '';
    const endpoint = `https://backendservices.clicknpay.africa/eticketservices/eventTicket/checkout/ClicknPay/${tellerEmail}/0775402193/NOTALLIANCE/GATESALES`;

    let successCount = 0;
    let failureCount = 0;
    const startSold = ticketsSold;
    const successes = []; // collect successful ticket data for teller copies

    for (let i = 0; i < qtyNum; i++) {
      const currentRemaining = Math.max(0, ROLL_MAX - (startSold + successCount));
      if (currentRemaining <= 0) {
        failureCount += (qtyNum - i);
        break;
      }

      try {
        setMsg(`Processing ${i + 1}/${qtyNum}...`);
        const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(makePayloadOnce()) });

        // Parse
        let data = null;
        try {
          data = await resp.clone().json();
          
        } catch {
          const txt = await resp.text();
          if (!resp.ok) throw new Error(txt || `Request failed (${resp.status})`);
          data = {};
        }
        if (!resp.ok) {
          const errText = typeof data === 'string' ? data : JSON.stringify(data);
          throw new Error(errText || `Request failed (${resp.status})`);
        }

        // Extract and print customer receipt now
        const ticket = Array.isArray(data.ticketIds) && data.ticketIds.length > 0 ? data.ticketIds[0] : null;
        const qrText = ticket?.qrCode || '';
        const ticketId = ticket?.ticketId || '';

        try {
          await printCustomerReceipt({ ticketId, qrText, priceStr });
          successCount += 1;
          successes.push({ ticketId, qrText, priceStr }); // store for teller copies and reprint
        } catch {
          failureCount += 1;
        }
      } catch {
        failureCount += 1;
      }
    }

    // After all customer receipts, print teller copies (no QR)
    for (const t of successes) {
      try {
        await printTellerCopy(t);
      } catch {
        // ignore individual teller copy failures in summary, optional: collect stats
      }
      await new Promise(r => setTimeout(r, 120));
    }

    // Update roll counter based on successful customer prints only
    if (successCount > 0) {
      persistTicketsSold(startSold + successCount);
      saveLastBatch({
        eventId: String(event.id),
        categoryId: String(category.id),
        tickets: successes.map((ticket) => ({
          ticketId: ticket.ticketId || '',
          qrText: ticket.qrText || '',
          priceStr: ticket.priceStr || ''
        })),
        timestamp: Date.now()
      });
    }

    // Reset
    setQuantity(1);
    setQuantityInput('1');

    // Summary
    if (failureCount === 0) setMsg(`Sale submitted successfully. Printed ${successCount} ticket(s) + ${successes.length} teller copy(ies).`);
    else if (successCount === 0) setMsg('No tickets were printed. Please try again.');
    else setMsg(`Printed ${successCount} ticket(s), ${failureCount} failed. Teller copies attempted: ${successes.length}.`);

    setBusy(false);
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
            <div><strong>Price:</strong> {category.forexPrice}</div>
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
              <div className="subtle" style={styles.subtle}>Paper roll full ({ROLL_MAX}/{ROLL_MAX}).</div>
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

              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button type="submit" disabled={busy} style={styles.btnPrimary}>
                  {busy ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={onBack} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openReprintAuth}
                  disabled={busy || !lastBatch || lastBatch.tickets?.length === 0}
                  style={{
                    ...styles.btnSecondary,
                    borderColor: '#4a90e2',
                    color: '#fff',
                    background: lastBatch ? '#4a90e2' : 'rgba(74,144,226,0.25)'
                  }}
                >
                  Reprint Previous Batch
                </button>
              </div>
            </form>
          )}

          {msg && <div style={styles.statusBox(msg.toLowerCase().includes('failed') ? 'salmon' : theme.accent)}>{msg}</div>}
        </div>
      </div>

      {/* Reprint Summary Card */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Batch Reprint</h4>
          <div style={styles.subtle}>
            {lastBatch && lastBatch.tickets?.length > 0
              ? `Last batch contains ${lastBatch.tickets.length} ticket(s). Reprints: ${reprintCount}.`
              : 'No previous batch available. Complete a sale first to enable reprint.'}
          </div>
          {lastBatch?.tickets?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={styles.pill}>Event ID: {lastBatch.eventId}</div>
              <div style={styles.pill}>Category ID: {lastBatch.categoryId}</div>
            </div>
          )}
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

      {/* ===== NEW: Admin - request reprint approval code ===== */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Admin — Request Reprint Code</h4>
          <div className="subtle" style={styles.subtle}>
            Enter the approver's email to send them a one-time code required to authorize a reprint.
          </div>
          <div style={styles.inlineForm}>
            <div style={styles.inlineField}>
              <label style={styles.label}>Approver Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={styles.inlineInput}
                placeholder="e.g. richard@clicknpay.africa"
              />
            </div>
            <button type="button" onClick={handleRequestCode} disabled={adminBusy} style={styles.btnPrimary}>
              {adminBusy ? 'Sending…' : 'Send Code'}
            </button>
          </div>
          {adminMsg && (
            <div style={styles.statusBox(adminMsg.toLowerCase().includes('fail') ? 'salmon' : theme.accent)}>
              {adminMsg}
            </div>
          )}
        </div>
      </div>

      {/* ===== NEW: Cashier - view own reprints ===== */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>My Reprints</h4>
          <div className="subtle" style={styles.subtle}>
            View reprints processed under your account ({cashierEmail || 'unknown user'}).
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button type="button" onClick={handleLoadMyReprints} disabled={myReprintsBusy} style={styles.btnPrimary}>
              {myReprintsBusy ? 'Loading…' : 'Load My Reprints'}
            </button>
            <button
              type="button"
              onClick={() => downloadReprintsCSV(`my-reprints_${cashierEmail || 'cashier'}.csv`, myReprints)}
              disabled={myReprints.length === 0}
              style={styles.btnSecondary}
            >
              Download CSV
            </button>
          </div>
          {myReprintsMsg && (
            <div style={styles.statusBox(myReprintsMsg.toLowerCase().includes('fail') ? 'salmon' : theme.accent)}>
              {myReprintsMsg}
            </div>
          )}
          {myReprints.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Approver Email</th>
                    <th style={styles.th}>Cashier Email</th>
                  
                    <th style={styles.th}>Ticket IDs</th>
                  </tr>
                </thead>
                <tbody>
                  {myReprints.map((r, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{r.approverEmail}</td>
                      <td style={styles.td}>{r.cashierEmail}</td>
                 
                      <td style={styles.td}>{Array.isArray(r.ticketIds) ? r.ticketIds.join(', ') : String(r.ticketIds ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== NEW: Supervisor - view reprints they approved ===== */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Supervisor Reprints</h4>
          <div className="subtle" style={styles.subtle}>
            Enter a supervisor/approver email to view all reprints they authorized.
          </div>
          <div style={styles.inlineForm}>
            <div style={styles.inlineField}>
              <label style={styles.label}>Supervisor Email</label>
              <input
                type="email"
                value={supervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                style={styles.inlineInput}
                placeholder="e.g. richard@clicknpay.africa"
              />
            </div>
            <button type="button" onClick={handleLoadSupervisorReprints} disabled={supervisorBusy} style={styles.btnPrimary}>
              {supervisorBusy ? 'Loading…' : 'Load Reprints'}
            </button>
            <button
              type="button"
              onClick={() => downloadReprintsCSV(`supervisor-reprints_${supervisorEmail || 'supervisor'}.csv`, supervisorReprints)}
              disabled={supervisorReprints.length === 0}
              style={styles.btnSecondary}
            >
              Download CSV
            </button>
          </div>
          {supervisorMsg && (
            <div style={styles.statusBox(supervisorMsg.toLowerCase().includes('fail') ? 'salmon' : theme.accent)}>
              {supervisorMsg}
            </div>
          )}
          {supervisorReprints.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Approver Email</th>
                    <th style={styles.th}>Cashier Email</th>
                    <th style={styles.th}>Ticket IDs</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorReprints.map((r, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{r.approverEmail}</td>
                      <td style={styles.td}>{r.cashierEmail}</td>
                      <td style={styles.td}>{Array.isArray(r.ticketIds) ? r.ticketIds.join(', ') : String(r.ticketIds ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== NEW: Reprint authorization modal ===== */}
      {reprintAuthOpen && (
        <div style={styles.modalOverlay} onClick={cancelReprintAuth}>
          <div style={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Authorize Reprint</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.8 }}>
                Enter the approver's email and the code sent to them to authorize reprinting {lastBatch?.tickets?.length || 0} ticket(s).
              </p>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.label}>Approver Email</label>
              <input
                type="email"
                value={approverEmail}
                onChange={(e) => setApproverEmail(e.target.value)}
                style={styles.input}
                placeholder="e.g. richard@clicknpay.africa"
              />
              <label style={styles.label}>Code</label>
              <input
                type="text"
                value={approverCode}
                onChange={(e) => setApproverCode(e.target.value)}
                style={styles.input}
                placeholder="Enter code sent to approver"
              />
              <div className="subtle" style={styles.subtle}>Cashier: {cashierEmail || 'unknown'}</div>
              {reprintAuthMsg && (
                <div style={styles.statusBox(reprintAuthMsg.toLowerCase().includes('fail') || reprintAuthMsg.toLowerCase().includes('enter') ? 'salmon' : theme.accent)}>
                  {reprintAuthMsg}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={cancelReprintAuth} disabled={reprintAuthBusy} style={styles.btnSecondary}>
                Cancel
              </button>
              <button type="button" onClick={handleAuthorizeAndReprint} disabled={reprintAuthBusy} style={styles.btnPrimary}>
                {reprintAuthBusy ? 'Authorizing…' : 'Authorize & Reprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
