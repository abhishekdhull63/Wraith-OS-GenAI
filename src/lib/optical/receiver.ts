export class OpticalReceiver {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private worker: Worker | null = null;
  private isScanning = false;
  private rafId: number | null = null;
  
  private chunks: string[] = [];
  private totalExpected = 0;
  
  constructor(
    private onProgress: (received: number, total: number) => void,
    private onComplete: (payload: string) => void,
    private onError: (err: string) => void
  ) {}

  public async start(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Initialize Web Worker for QR Decoding
    this.worker = new Worker(new URL('./qrWorker.ts', import.meta.url), { type: 'module' });
    
    this.chunks = [];
    this.totalExpected = 0;
    
    this.worker.onmessage = (e) => {
      if (e.data.type === 'decoded') {
         this.handleDecodedString(e.data.text);
      }
      // Regardless of success or fail, schedule next scan frame.
      // This prevents the worker from overlapping itself and crashing RAM.
      if (this.isScanning) {
         this.rafId = requestAnimationFrame(this.scanFrame);
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      this.video.srcObject = this.stream;
      this.video.setAttribute("playsinline", "true"); 
      await this.video.play();
      
      this.isScanning = true;
      this.rafId = requestAnimationFrame(this.scanFrame);
      
    } catch (err: any) {
      this.onError('Camera access denied or hardware fault: ' + err.message);
    }
  }

  private scanFrame = () => {
    if (!this.isScanning || !this.video || !this.canvas || !this.ctx || !this.worker) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Sync canvas bounds
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Offload to worker
      this.worker.postMessage({
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
      }, [imageData.data.buffer]); // Transfer buffer to avoid heavy copying
    } else {
      // Wait for camera to warm up
      this.rafId = requestAnimationFrame(this.scanFrame);
    }
  };

  private handleDecodedString(text: string) {
    if (!text.startsWith('ARGUS|')) return;
    
    const parts = text.split('|');
    if (parts.length < 4) return;
    
    const total = parseInt(parts[1], 10);
    const index = parseInt(parts[2], 10);
    const payloadSegment = parts.slice(3).join('|'); // In case payload has '|'
    
    if (this.totalExpected === 0) {
       this.totalExpected = total;
       this.chunks = new Array(total).fill(null);
    }
    
    if (this.chunks[index] === null) {
       this.chunks[index] = payloadSegment;
       
       const receivedCount = this.chunks.filter(c => c !== null).length;
       this.onProgress(receivedCount, this.totalExpected);
       
       if (receivedCount === this.totalExpected) {
          // Transmission Complete
          this.isScanning = false;
          const finalPayload = this.chunks.join('');
          this.onComplete(finalPayload);
          this.stop();
       }
    }
  }

  public stop() {
    this.isScanning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.worker) this.worker.terminate();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }
}
