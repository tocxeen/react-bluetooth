import BluetoothService from './BluetoothService';

class PrinterService {
  constructor() {
    this.encoder = new TextEncoder();
  }

  // ESC/POS commands for thermal printers
  getESCPOSCommands() {
    return {
      INIT: new Uint8Array([0x1B, 0x40]), // Initialize printer
      ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]), // Center align
      ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]), // Left align
      BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]), // Bold on
      BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]), // Bold off
      CUT_PAPER: new Uint8Array([0x1D, 0x56, 0x42, 0x00]), // Cut paper
      LINE_FEED: new Uint8Array([0x0A]), // Line feed
      CARRIAGE_RETURN: new Uint8Array([0x0D]), // Carriage return
    };
  }

  async sendCommand(command) {
    if (!BluetoothService.isConnected()) {
      throw new Error('No printer connected');
    }

    const characteristic = BluetoothService.getCharacteristic();
    
    if (!characteristic) {
      throw new Error('No writable characteristic found. Device may have disconnected.');
    }

    // For real devices, verify the connection is still active
    const device = BluetoothService.getConnectedDevice();
    if (device && device.gatt && !characteristic.uuid.includes('mock') && !characteristic.uuid.includes('fallback')) {
      if (!device.gatt.connected) {
        throw new Error('Device connection lost. Please reconnect.');
      }
    }

    try {
      console.log('Sending command of length:', command.length, 'to characteristic:', characteristic.uuid);
      
      if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(command);
        console.log('Command sent without response');
      } else if (characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(command);
        console.log('Command sent with response');
      } else if (characteristic.properties && characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(command);
        console.log('Command sent without response (properties check)');
      } else if (characteristic.properties && characteristic.properties.write) {
        await characteristic.writeValueWithResponse(command);
        console.log('Command sent with response (properties check)');
      } else {
        console.warn('Using fallback write method');
        // Fallback for mock characteristics
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('Fallback write completed');
      }
      
      // Small delay between commands
      await new Promise(resolve => setTimeout(resolve, 50));
      return true;
    } catch (error) {
      console.error('Error sending command to printer:', error);
      throw error;
    }
  }

  async sendText(text) {
    const textBytes = this.encoder.encode(text);
    await this.sendCommand(textBytes);
  }

  // Print QR code using ESC/POS "GS ( k" commands
  async printQRCode(qrText, options = {}) {
    if (!qrText) throw new Error('QR text is empty');

    const size = Math.max(1, Math.min(16, options.size || 6)); // module size 1..16
    const ecLevel = (options.errorCorrection || 'M').toUpperCase(); // L/M/Q/H
    const ecMap = { L: 48, M: 49, Q: 50, H: 51 };
    const ec = ecMap[ecLevel] ?? ecMap.M;

    const data = this.encoder.encode(qrText);

    // Build helper to send a full ESC/POS buffer
    const sendRaw = async (arr) => this.sendCommand(new Uint8Array(arr));

    // Select model: 2
    await sendRaw([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);

    // Set size
    await sendRaw([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]);

    // Set error correction
    await sendRaw([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, ec]);

    // Store data
    const storeLen = data.length + 3; // 3 bytes for cn, fn, m
    const pL = storeLen & 0xff;
    const pH = (storeLen >> 8) & 0xff;
    const header = [0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30];
    await this.sendCommand(new Uint8Array([...header, ...data]));

    // Print symbol
    await sendRaw([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

    // Small feed
    await this.sendCommand(new Uint8Array([0x0A]));
  }

  // Print a small receipt for a sale, with QR and a teller copy (no QR)
  async printSaleReceipt({ 
    eventDescription, 
    categoryName, 
    tellerEmail, 
    ticketId, 
    price, 
    quantity, 
    venueName, 
    eventDateMs, 
    qrText 
  }) {
    const commands = this.getESCPOSCommands();
    const dateStr = eventDateMs ? new Date(eventDateMs).toLocaleString() : '';

    // Initialize
    await this.sendCommand(commands.INIT);

    // Header
    await this.sendCommand(commands.ALIGN_CENTER);
    await this.sendCommand(commands.BOLD_ON);
    await this.sendText('ClicknPay POS\n');
    await this.sendCommand(commands.BOLD_OFF);

    // Event title
    if (eventDescription) {
      await this.sendText(`${eventDescription}\n`);
    }

    // Details (customer copy)
    await this.sendCommand(commands.ALIGN_LEFT);
    if (categoryName) await this.sendText(`Event Category: ${categoryName}\n`);
    if (tellerEmail) await this.sendText(`Teller: ${tellerEmail}\n`);
    if (ticketId) await this.sendText(`Ticket#: ${ticketId}\n`);
    if (price != null && price !== '') await this.sendText(`Price: ${price}\n`);
    if (quantity != null && quantity !== '') await this.sendText(`Quantity: ${quantity}\n`);
    if (venueName) await this.sendText(`Venue: ${venueName}\n`);
    if (dateStr) await this.sendText(`Date & Time: ${dateStr}\n`);

    // QR centered
    await this.sendCommand(commands.ALIGN_CENTER);
    if (qrText) {
      await this.printQRCode(qrText, { size: 6, errorCorrection: 'M' });
    }

    // Footer
    await this.sendText('---------------------------------\n');
    await this.sendText('Thank you for using Clicknpay.\n');
    await this.sendCommand(commands.LINE_FEED);

    // Teller copy (no QR)
    await this.sendCommand(commands.ALIGN_CENTER);
    await this.sendCommand(commands.BOLD_ON);
    await this.sendText('Teller Copy\n');
    await this.sendCommand(commands.BOLD_OFF);
    await this.sendCommand(commands.ALIGN_LEFT);

    if (ticketId) await this.sendText(`Ticket Id: ${ticketId}\n`);
    if (categoryName) await this.sendText(`Category: ${categoryName}\n`);
    if (price != null && price !== '') await this.sendText(`Price: ${price}\n`);
    if (dateStr) await this.sendText(`Date & Time: ${dateStr}\n`);
    if (tellerEmail) await this.sendText(`Teller: ${tellerEmail}\n`);
    if (quantity != null && quantity !== '') await this.sendText(`Quantity: ${quantity}\n`);

    await this.sendCommand(commands.LINE_FEED);
    // Optional cut
    try { await this.sendCommand(commands.CUT_PAPER); } catch {}

    return true;
  }

  async printTestPage() {
    const commands = this.getESCPOSCommands();
    
    try {
      // Initialize printer
      await this.sendCommand(commands.INIT);
      
      // Print header
      await this.sendCommand(commands.ALIGN_CENTER);
      await this.sendCommand(commands.BOLD_ON);
      await this.sendCommand(this.encoder.encode('THERMAL PRINTER TEST\n'));
      await this.sendCommand(commands.BOLD_OFF);
      
      // Print separator
      await this.sendCommand(this.encoder.encode('========================\n'));
      
      // Print test content
      await this.sendCommand(commands.ALIGN_LEFT);
      await this.sendCommand(this.encoder.encode('Device: ' + (BluetoothService.getConnectedDevice()?.name || 'Unknown') + '\n'));
      await this.sendCommand(this.encoder.encode('Date: ' + new Date().toLocaleString() + '\n'));
      await this.sendCommand(this.encoder.encode('Status: Connected\n'));
      
      // Add some space
      await this.sendCommand(commands.LINE_FEED);
      await this.sendCommand(commands.LINE_FEED);
      
      // Print footer
      await this.sendCommand(commands.ALIGN_CENTER);
      await this.sendCommand(this.encoder.encode('Test completed successfully!\n'));
      
      // Cut paper (if supported)
      await this.sendCommand(commands.CUT_PAPER);
      
      return true;
    } catch (error) {
      console.error('Error printing test page:', error);
      throw error;
    }
  }
}

export default new PrinterService();
