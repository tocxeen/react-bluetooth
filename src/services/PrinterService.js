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
