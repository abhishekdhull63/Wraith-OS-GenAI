/**
 * FSK Demodulator (Acoustic Receiver)
 * Processes incoming fast-fourier PCM buffers from the `getUserMedia` hook
 * and slices magnitudes at 18kHz/19kHz mathematically into binary arrays.
 */

export class FSKDemodulator {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private baudRate = 20;
  private freq0 = 18000;
  private freq1 = 19000;

  public isListening = false;
  private logicBuffer = '';
  private receiving = false;

  constructor(private onDecodedPayload: (payload: string) => void) {}

  public async start() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.0; // Instanteous magnitudes

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this.isListening = true;
      this.logicBuffer = '';
      this.receiving = false;
    } catch (e) {
      throw e;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // The caller (like a React Hook or Canvas Loop) must call this method regularly (e.g. 60fps)
  // to process incoming magnitude bytes and run the parser.
  public pollSpectrum(dataArray: Float32Array) {
    if (!this.isListening || !this.ctx || !this.analyser) return;

    const nyquist = this.ctx.sampleRate / 2;
    const binSize = nyquist / this.analyser.frequencyBinCount;

    const bin0 = Math.round(this.freq0 / binSize);
    const bin1 = Math.round(this.freq1 / binSize);

    const mag0 = dataArray[bin0];
    const mag1 = dataArray[bin1];

    const threshold = -75; // dB. Absolute silence is -100dB in WebAudio Floats.

    let currentBit: string | null = null;
    if (mag1 > threshold && mag1 > mag0 + 5) {
      currentBit = '1';
    } else if (mag0 > threshold && mag0 > mag1 + 5) {
      currentBit = '0';
    }

    if (currentBit !== null) {
      // Very crude baud rate parser for demonstration UI.
      // Because RAF runs at 60fps (~16ms), and 20 baud = 50ms,
      // we sample the same bit ~3 times. We just look for edges or debounce.
      // For Demo: we append and then regex out the duplications or just rely on a strict sliding window.
      // Let's debounce logic appending based on elapsed time vs last logic capture hook.
      const now = performance.now();
      if (!this._lastSampleTime || now - this._lastSampleTime >= (1000 / this.baudRate) * 0.9) {
        this._lastSampleTime = now;
        this.logicBuffer += currentBit;
        this.parseBuffer();
      }
    }
  }

  private _lastSampleTime = 0;

  private parseBuffer() {
    // Look for Header: '101010101111'
    if (!this.receiving && this.logicBuffer.includes('101010101111')) {
      this.receiving = true;
      // Trim everything before and including the header
      const headerIndex = this.logicBuffer.indexOf('101010101111');
      this.logicBuffer = this.logicBuffer.substring(headerIndex + 12);
    }

    if (this.receiving) {
      // Need 16 bits for length
      if (this.logicBuffer.length >= 16) {
        const lenBits = this.logicBuffer.substring(0, 16);
        const payloadBytesAmount = parseInt(lenBits, 2);

        const expectedTotalBits = 16 + payloadBytesAmount * 8 + 8; // 16 len + N payload + 8 dummy checksum

        if (this.logicBuffer.length >= expectedTotalBits) {
          // Extraction Ready
          const payloadBits = this.logicBuffer.substring(16, 16 + payloadBytesAmount * 8);

          let bytes: number[] = [];
          for (let i = 0; i < payloadBits.length; i += 8) {
            const binByte = payloadBits.substring(i, i + 8);
            bytes.push(parseInt(binByte, 2));
          }

          const decoder = new TextDecoder();
          const decodedString = decoder.decode(new Uint8Array(bytes));

          this.onDecodedPayload(decodedString);

          // Reset for next transmission
          this.receiving = false;
          this.logicBuffer = '';
        }
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
