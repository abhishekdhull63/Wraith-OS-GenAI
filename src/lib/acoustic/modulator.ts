/**
 * FSK Modulator (Acoustic Transmission)
 * Converts text into binary Streams and plays them across high frequencies (18kHz, 19kHz)
 * for stealth Air-Gap data transfers.
 */

export class FSKModulator {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private baudRate = 20; // 20 bits per second (50ms per bit) for stable room-scale transmission demo
  private freq0 = 18000;
  private freq1 = 19000;

  public async init(): Promise<void> {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // BROWSER OVERRIDE: Force wake suspended AudioContexts before spawning generator nodes
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    
    this.osc.type = 'sine';
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    
    this.gain.gain.value = 0; // Mute initially
    this.osc.start();
  }

  public async transmit(payload: string): Promise<void> {
    if (!this.ctx || !this.osc || !this.gain) {
      throw new Error('Modulator not initialized');
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // 1. Text to Binary String
    const encoder = new TextEncoder();
    const bytes = encoder.encode(payload);
    
    let bitString = '';
    // Header sequence: Alternating 10101010 (8 bits) + 1111 (Start symbol)
    bitString += '101010101111';

    // Length of payload (16 bits)
    bitString += bytes.length.toString(2).padStart(16, '0');

    // Payload payload 
    for (let i = 0; i < bytes.length; i++) {
        bitString += bytes[i].toString(2).padStart(8, '0');
    }

    // Parity / Checksum (dummy 8 bits for demo)
    bitString += '00000000';

    const bitDuration = 1 / this.baudRate;
    let startTime = this.ctx.currentTime + 0.1;

    // Open Gain
    this.gain.gain.setValueAtTime(1, startTime);

    for (let i = 0; i < bitString.length; i++) {
        const bit = bitString[i];
        const freq = bit === '1' ? this.freq1 : this.freq0;
        
        // Exact mathematical scheduling
        this.osc.frequency.setValueAtTime(freq, startTime);
        startTime += bitDuration;
    }

    // Close Gain exactly at the end
    this.gain.gain.setValueAtTime(0, startTime);
    
    return new Promise((resolve) => {
        setTimeout(resolve, (startTime - this.ctx!.currentTime) * 1000 + 100);
    });
  }

  public destroy() {
    if (this.osc) {
      this.osc.stop();
      this.osc.disconnect();
    }
    if (this.gain) {
       this.gain.disconnect();
    }
    if (this.ctx) {
       this.ctx.close();
    }
  }
}
