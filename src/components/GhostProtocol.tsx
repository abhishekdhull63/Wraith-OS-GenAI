import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Key, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GhostProtocolProps {
  onLog?: (type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS', message: string) => void;
}

export default function GhostProtocol({ onLog }: GhostProtocolProps) {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');

  // Encode state
  const [payloadText, setPayloadText] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectedImage, setInjectedImage] = useState<string | null>(null);

  // Decode state
  const [decodeImage, setDecodeImage] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedJSON, setDecodedJSON] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── LSB Steganography Helpers ────────────────────────────────────────────────

  // Convert string to a Uint8Array of bits, prepended with a 32-bit length header
  const textToBits = (text: string): Uint8Array => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const bitLen = bytes.length * 8;

    // Total bits = 32 (length header) + data bits
    const bits = new Uint8Array(32 + bitLen);

    // Write 32-bit length header (big-endian)
    for (let i = 0; i < 32; i++) {
      bits[i] = (bytes.length >> (31 - i)) & 1;
    }

    // Write data bits
    let offset = 32;
    for (let i = 0; i < bytes.length; i++) {
      for (let j = 7; j >= 0; j--) {
        bits[offset++] = (bytes[i] >> j) & 1;
      }
    }

    return bits;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'encode' | 'decode') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/png') && type === 'encode') {
      onLog?.('WARNING', 'Use PNG for cover images to prevent lossy compression destroying LSB data.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        if (type === 'encode') {
          setCoverImage(event.target.result);
          setInjectedImage(null);
          onLog?.('INFO', `Ghost Protocol cover image acquired: ${file.name}`);
        } else {
          setDecodeImage(event.target.result);
          setDecodedJSON('');
          onLog?.('INFO', `Ghost Protocol decoding subject acquired: ${file.name}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInject = useCallback(async () => {
    if (!coverImage || !payloadText.trim()) return;

    setIsInjecting(true);
    onLog?.('INFO', 'INITIATING LSB INJECTION...');

    try {
      const payloadBits = textToBits(payloadText);

      // 2. Load Image to Canvas
      const img = new Image();
      img.src = coverImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas Context not found');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 3. Check capacity (3 color channels per pixel, alpha is skipped)
      // data.length is width*height*4. Number of pixels is data.length / 4
      // We can store 3 bits per pixel (R, G, B channels)
      const maxBits = (data.length / 4) * 3;
      if (payloadBits.length > maxBits) {
        throw new Error(`Image size too small. Requires ${payloadBits.length} bits, capacity: ${maxBits} bits`);
      }

      // 4. Inject Bits into LSB
      let bitIdx = 0;
      for (let i = 0; i < data.length && bitIdx < payloadBits.length; i += 4) {
        // Red channel
        if (bitIdx < payloadBits.length) {
          data[i] = (data[i] & ~1) | payloadBits[bitIdx++];
        }
        // Green channel
        if (bitIdx < payloadBits.length) {
          data[i + 1] = (data[i + 1] & ~1) | payloadBits[bitIdx++];
        }
        // Blue channel
        if (bitIdx < payloadBits.length) {
          data[i + 2] = (data[i + 2] & ~1) | payloadBits[bitIdx++];
        }
        // Skip Alpha (data[i + 3]) to prevent obvious transparency artifacts
      }

      ctx.putImageData(imageData, 0, 0);

      // 5. Generate Output Image (MUST be PNG to preserve LSBs)
      setInjectedImage(canvas.toDataURL('image/png'));
      onLog?.('SUCCESS', `✅ LSB Injection successful. Payload size: ${payloadBits.length} bits.`);
    } catch (err: any) {
      onLog?.('ERROR', `Injection failed: ${err.message}`);
    } finally {
      setIsInjecting(false);
    }
  }, [coverImage, payloadText, onLog]);

  const handleDecode = useCallback(async () => {
    if (!decodeImage) return;

    setIsDecoding(true);
    onLog?.('INFO', 'COMMENCING LSB EXTRACTION...');

    try {
      const img = new Image();
      img.src = decodeImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not found');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Build a flat array of ONLY R, G, B channel indices (skip Alpha every 4th byte)
      const channelIndices: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if ((i + 1) % 4 !== 0) channelIndices.push(i); // skip alpha (index 3, 7, 11, ...)
      }

      // 1. Read 32-bit length header from the first 32 R/G/B LSBs
      let byteLen = 0;
      for (let b = 0; b < 32; b++) {
        byteLen = (byteLen << 1) | (data[channelIndices[b]] & 1);
      }

      // Sanity check
      const maxBytes = Math.floor(channelIndices.length / 8);
      if (byteLen <= 0 || byteLen > maxBytes) {
        throw new Error('Invalid or missing LSB header signature. No payload detected.');
      }

      // 2. Read payload bytes starting at bit offset 32
      const decodedBytes = new Uint8Array(byteLen);
      const totalPayloadBits = byteLen * 8;

      for (let b = 0; b < totalPayloadBits; b++) {
        const ci = 32 + b; // offset past the 32-bit header
        if (ci >= channelIndices.length) break;

        const byteIdx = Math.floor(b / 8);
        const bitPos = 7 - (b % 8); // big-endian bit order within each byte

        if (data[channelIndices[ci]] & 1) {
          decodedBytes[byteIdx] |= 1 << bitPos;
        }
      }

      const decoder = new TextDecoder();
      const extractedText = decoder.decode(decodedBytes);

      setDecodedJSON(extractedText);
      onLog?.('SUCCESS', `✅ Payload extracted successfully [${byteLen} bytes].`);
    } catch (err: any) {
      onLog?.('ERROR', `Extraction failed: ${err.message}`);
    } finally {
      setIsDecoding(false);
    }
  }, [decodeImage, onLog]);

  return (
    <div className="glass-card p-6 border-l-4 border-l-purple-500 rounded-xl space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <EyeOff className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">Ghost Protocol</h3>
          <p className="text-xs text-gray-500 font-mono">LSB Image Steganography</p>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-6">
        <button
          className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'encode' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('encode')}
        >
          [ ENCODE PAYLOAD ]
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'decode' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('decode')}
        >
          [ EXTRACT & DECODE ]
        </button>
      </div>

      {activeTab === 'encode' && (
        <div className="space-y-4 animate-fade-in">
          {/* Payload text input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                Secret Message
              </label>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:border-purple-500/50 outline-none resize-none min-h-[80px] font-mono placeholder:text-gray-600"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder="Enter secret message to encode..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                Cover Image (PNG/JPG)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'encode')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-black/40 border border-white/10 border-dashed rounded-lg p-3 text-sm text-gray-400 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  {coverImage ? 'IMAGE ACQUIRED' : 'CLICK TO UPLOAD'}
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleInject}
            disabled={!coverImage || !payloadText.trim() || isInjecting}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
               ${
                 !coverImage || !payloadText.trim()
                   ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                   : 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
               }
            `}
          >
            {isInjecting ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Key className="w-4 h-4" />}
            {isInjecting ? 'INJECTING PAYLOAD...' : 'INJECT LSB PAYLOAD'}
          </button>

          {/* Result Block */}
          {injectedImage && (
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Weaponized Asset Ready
              </div>
              <div className="h-40 w-full rounded-lg overflow-hidden border border-white/10 relative group">
                <img src={injectedImage} alt="Injected" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={injectedImage}
                    download="classified_asset.png"
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD ASSET
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-mono text-center">
                Asset MUST be shared as an uncompressed file to preserve integrity.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'decode' && (
        <div className="space-y-4 animate-fade-in">
          <div className="relative h-32 w-full bg-black/40 border-2 border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-gray-400 group">
            <input
              type="file"
              accept="image/png"
              onChange={(e) => handleImageUpload(e, 'decode')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Viewfinder className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors" />
            <span className="text-sm font-semibold uppercase tracking-widest">
              {decodeImage ? 'ASSET LOADED' : 'DROP ASSET HERE'}
            </span>
          </div>

          <button
            onClick={handleDecode}
            disabled={!decodeImage || isDecoding}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
               ${
                 !decodeImage
                   ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                   : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
               }
            `}
          >
            {isDecoding ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <EyeOff className="w-4 h-4" />}
            {isDecoding ? 'EXTRACTING...' : 'EXTRACT PAYLOAD'}
          </button>

          {decodedJSON && (
            <div className="p-4 bg-black/60 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-emerald-400 text-xs font-mono font-bold tracking-widest border-b border-emerald-500/20 pb-2">
                <span>// PAYLOAD.TXT</span>
              </div>
              <div className="max-h-40 overflow-y-auto text-xs text-gray-300 font-mono whitespace-pre-wrap pt-1">
                {decodedJSON}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

// Custom icon
function Viewfinder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  );
}
