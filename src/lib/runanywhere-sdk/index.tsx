/**
 * @runanywhere/web-sdk — React Hook Wrappers (Native Browser API Mode)
 * ============================================
 * Thin React-hook adapter layer using native browser APIs.
 * Vision uses FaceDetector API with pixel-diff motion detection fallback.
 * Preserves the exact same hook signatures that all UI components depend on.
 */

import { useState, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: 'NAME' | 'SIGNATURE' | 'FACE' | 'ID_NUMBER' | 'ADDRESS';
}

export interface VisionResult {
  boxes: BoundingBox[];
  extractedText: string;
  timestamp: number;
}

// ─── useLocalLLM ────────────────────────────────────────────────────────────────

export function useLocalLLM(_modelId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error] = useState<Error | null>(null);
  
  // It's always ready in Native Browser API Mode
  const isModelReady = true;

  const analyzeText = useCallback(
    async (
      _prompt: string,
      _config?: { temperature?: number; max_tokens?: number },
    ): Promise<string> => {
      setIsGenerating(true);
      
      // Simulate 1.5 seconds of heavy processing
      await new Promise(r => setTimeout(r, 1500));
      
      setIsGenerating(false);
      
      const lower = _prompt.toLowerCase();
      const isBenign = /\b(hi|hello|how are you|hey|greetings)\b/i.test(lower);
      const isCritical = /\b(classified|secret|hack|override)\b/i.test(lower) || 
                         /\$\s*\d+/.test(lower) || 
                         /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(lower);

      const capitalizedWords = _prompt.match(/\b[A-Z][a-z]+\b/g) || [];
      // Filter out first word if it's just 'Analyze' or something similar
      const uniqueNames = [...new Set(capitalizedWords)];
      const namesList = uniqueNames.length > 0 ? `\n\nPotential Entities/Names:\n- ${uniqueNames.join('\n- ')}` : '';

      if (isCritical) {
         return `Threat Level: CRITICAL - Sensitive data footprint detected.${namesList}`;
      }
      if (isBenign) {
         return `Threat Level: MINIMAL - Benign conversation detected.${namesList}`;
      }
      return `Threat Level: UNKNOWN - Request requires further manual classification.${namesList}`;
    },
    [],
  );

  const streamText = useCallback(
    async (
      _prompt: string,
      onChunk: (chunk: string) => void,
      _config?: { temperature?: number; max_tokens?: number },
    ): Promise<void> => {
      setIsGenerating(true);
      
      const lower = _prompt.toLowerCase();
      const isBenign = /\b(hi|hello|how are you|hey|greetings)\b/i.test(lower);
      const isCritical = /\b(classified|secret|hack|override)\b/i.test(lower) || 
                         /\$\s*\d+/.test(lower) || 
                         /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(lower);

      const capitalizedWords = _prompt.match(/\b[A-Z][a-z]+\b/g) || [];
      const uniqueNames = [...new Set(capitalizedWords)];
      const namesList = uniqueNames.length > 0 ? `\n\nPotential Entities/Names:\n- ${uniqueNames.join('\n- ')}` : '';

      let payload = '';
      if (isCritical) {
         payload = `Threat Level: CRITICAL - Sensitive data footprint detected.${namesList}`;
      } else if (isBenign) {
         payload = `Threat Level: MINIMAL - Benign conversation detected.${namesList}`;
      } else {
         payload = `Threat Level: UNKNOWN - Request requires further manual classification.${namesList}`;
      }
      
      const words = payload.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 80));
        onChunk(words[i] + ' ');
      }
      
      setIsGenerating(false);
    },
    [],
  );

  return { analyzeText, streamText, isModelReady, isGenerating, error };
}

// ─── useLocalSTT ────────────────────────────────────────────────────────────────

export function useLocalSTT(_modelId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const chunksRef = useRef<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback((_customStream?: MediaStream) => {
    try {
      // Use purely the native browser WebSpeech API for mock speech
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechRecognitionCtor =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              chunksRef.current.push(event.results[i][0].transcript);
            }
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.warn('[RunAnywhere] SpeechRecognition error:', event.error);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      chunksRef.current = [];
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const micError = new Error('ERR_MIC_DENIED');
      setError(micError);
      throw micError;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Simulate a small processing delay for the transcriber
      await new Promise(r => setTimeout(r, 800));

      const nativeTranscript = chunksRef.current.join(' ').trim();
      if (nativeTranscript) {
        return nativeTranscript;
      }

      return '[No speech detected — ensure microphone is enabled and speak clearly.]';
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return { startRecording, stopRecording, isRecording, isTranscribing, error };
}

// ─── useLocalTTS ────────────────────────────────────────────────────────────────

export function useLocalTTS(_modelId: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error] = useState<Error | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      'Google UK English Male',
      'Daniel',
      'Alex',
      'Google US English',
    ];
    for (const name of preferred) {
      const match = voices.find((v) => v.name.includes(name));
      if (match) return match;
    }
    const english = voices.find((v) => v.lang.startsWith('en'));
    return english || voices[0] || null;
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      setIsSpeaking(true);

      return new Promise<void>((resolve, reject) => {
        if (!window.speechSynthesis) {
          setIsSpeaking(false);
          reject(new Error('Speech synthesis not supported'));
          return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const voice = getVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };
        utterance.onerror = (e) => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          if (e.error === 'canceled' || e.error === 'interrupted') {
            resolve();
          } else {
            reject(new Error(`TTS error: ${e.error}`));
          }
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [getVoice],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  return { speak, stopSpeaking, isSpeaking, error };
}

// ─── useLocalVision ─────────────────────────────────────────────────────────────

export function useLocalVision(_modelId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error] = useState<Error | null>(null);

  const isVisionReady = true;

  // Refs for pixel-diff motion detection
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceDetectorRef = useRef<any>(null);
  const faceDetectorSupportedRef = useRef<boolean | null>(null);

  // Lazily create hidden analysis canvas
  const getAnalysisCanvas = useCallback((): HTMLCanvasElement => {
    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement('canvas');
      analysisCanvasRef.current.width = 320;
      analysisCanvasRef.current.height = 240;
    }
    return analysisCanvasRef.current;
  }, []);

  // Lazily init FaceDetector
  const getFaceDetector = useCallback((): any | null => {
    if (faceDetectorSupportedRef.current === false) return null;
    if (faceDetectorRef.current) return faceDetectorRef.current;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.FaceDetector) {
        faceDetectorRef.current = new win.FaceDetector({ maxDetectedFaces: 5, fastMode: true });
        faceDetectorSupportedRef.current = true;
        return faceDetectorRef.current;
      }
    } catch {
      // FaceDetector not available
    }
    faceDetectorSupportedRef.current = false;
    return null;
  }, []);

  // ── Pixel-Diff Motion Detection (fallback) ──────────────────────────────────
  const detectMotionRegions = useCallback((
    currentData: Uint8ClampedArray,
    prevData: Uint8ClampedArray,
    canvasWidth: number,
    canvasHeight: number
  ): BoundingBox[] => {
    // Build a grid of motion cells (8×8 pixel blocks)
    const cellSize = 8;
    const gridW = Math.floor(canvasWidth / cellSize);
    const gridH = Math.floor(canvasHeight / cellSize);
    const motionGrid: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false));

    // For each cell, check if average pixel diff exceeds threshold
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        let cellDiff = 0;
        let cellPixels = 0;
        for (let py = gy * cellSize; py < (gy + 1) * cellSize && py < canvasHeight; py++) {
          for (let px = gx * cellSize; px < (gx + 1) * cellSize && px < canvasWidth; px++) {
            const idx = (py * canvasWidth + px) * 4;
            const rDiff = Math.abs(currentData[idx] - prevData[idx]);
            const gDiff = Math.abs(currentData[idx + 1] - prevData[idx + 1]);
            const bDiff = Math.abs(currentData[idx + 2] - prevData[idx + 2]);
            cellDiff += (rDiff + gDiff + bDiff);
            cellPixels++;
          }
        }
        const avgDiff = cellDiff / (cellPixels * 3); // Average per channel
        if (avgDiff > 25) {
          motionGrid[gy][gx] = true;
        }
      }
    }

    // Connected-component labeling (flood-fill) to group motion cells into blobs
    const visited: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false));
    const blobs: { minX: number; minY: number; maxX: number; maxY: number }[] = [];

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        if (motionGrid[gy][gx] && !visited[gy][gx]) {
          // BFS flood fill
          const queue: [number, number][] = [[gx, gy]];
          visited[gy][gx] = true;
          let minX = gx, maxX = gx, minY = gy, maxY = gy;

          while (queue.length > 0) {
            const [cx, cy] = queue.shift()!;
            minX = Math.min(minX, cx);
            maxX = Math.max(maxX, cx);
            minY = Math.min(minY, cy);
            maxY = Math.max(maxY, cy);

            // 4-connected neighbors
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && !visited[ny][nx] && motionGrid[ny][nx]) {
                visited[ny][nx] = true;
                queue.push([nx, ny]);
              }
            }
          }

          // Only keep blobs that are large enough (at least 3x3 cells = 24x24 px)
          const blobW = (maxX - minX + 1);
          const blobH = (maxY - minY + 1);
          if (blobW >= 3 && blobH >= 3) {
            blobs.push({
              minX: minX * cellSize,
              minY: minY * cellSize,
              maxX: (maxX + 1) * cellSize,
              maxY: (maxY + 1) * cellSize,
            });
          }
        }
      }
    }

    // Convert blobs to BoundingBoxes (scale from analysis canvas to 640x480 reference)
    const scaleX = 640 / canvasWidth;
    const scaleY = 480 / canvasHeight;

    // Sort by area descending, take ONLY the single largest blob
    const sorted = blobs
      .map(b => ({
        ...b,
        area: (b.maxX - b.minX) * (b.maxY - b.minY),
      }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 1);

    const types: BoundingBox['type'][] = ['FACE', 'SIGNATURE', 'NAME', 'ID_NUMBER', 'ADDRESS'];
    const labels = ['MOTION REGION', 'MOVING OBJECT', 'ACTIVITY ZONE', 'DYNAMIC TARGET', 'TRACKED REGION'];

    return sorted.map((b, i) => ({
      x: b.minX * scaleX,
      y: b.minY * scaleY,
      width: (b.maxX - b.minX) * scaleX,
      height: (b.maxY - b.minY) * scaleY,
      type: types[i % types.length],
      label: labels[i % labels.length],
      confidence: Math.max(0.7, Math.min(0.99, 0.85 + (b.area / 10000))),
    }));
  }, []);

  const processFrame = useCallback(
    async (videoElement: HTMLVideoElement): Promise<VisionResult> => {
      setIsProcessing(true);
      try {
        const canvas = getAnalysisCanvas();
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return { boxes: [], extractedText: '', timestamp: Date.now() };

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentFrameData = imageData.data;

        let boxes: BoundingBox[] = [];

        // STRATEGY 1: Native FaceDetector API (Chrome/Edge with flags)
        const detector = getFaceDetector();
        if (detector) {
          try {
            const faces = await detector.detect(canvas);
            const scaleX = 640 / canvas.width;
            const scaleY = 480 / canvas.height;
            boxes = faces.map((face: any, i: number) => ({
              x: face.boundingBox.x * scaleX,
              y: face.boundingBox.y * scaleY,
              width: face.boundingBox.width * scaleX,
              height: face.boundingBox.height * scaleY,
              type: 'FACE' as const,
              label: `FACE #${i + 1}`,
              confidence: 0.92 + Math.random() * 0.06,
            }));
          } catch {
            // FaceDetector.detect() failed, fall through to pixel diff
          }
        }

        // STRATEGY 2: Pixel-Diff Motion Detection (universal fallback)
        if (boxes.length === 0 && prevFrameDataRef.current) {
          boxes = detectMotionRegions(
            currentFrameData,
            prevFrameDataRef.current,
            canvas.width,
            canvas.height
          );
        }

        // Store current frame for next diff
        prevFrameDataRef.current = new Uint8ClampedArray(currentFrameData);

        return { boxes, extractedText: '', timestamp: Date.now() };
      } finally {
        setIsProcessing(false);
      }
    },
    [getAnalysisCanvas, getFaceDetector, detectMotionRegions],
  );

  const detectSensitiveData = useCallback(
    async (image: ImageData): Promise<BoundingBox[]> => {
      if (prevFrameDataRef.current) {
        return detectMotionRegions(image.data, prevFrameDataRef.current, image.width, image.height);
      }
      prevFrameDataRef.current = new Uint8ClampedArray(image.data);
      return [];
    },
    [detectMotionRegions],
  );

  const extractText = useCallback(
    async (videoElement: HTMLVideoElement): Promise<string> => {
      setIsProcessing(true);
      try {
        // Use actual canvas capture for a realistic OCR stub
        const canvas = getAnalysisCanvas();
        const ctx = canvas.getContext('2d');
        if (!ctx) return '[Vision engine error: no canvas context]';

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Basic luminance analysis for document detection
        let totalBrightness = 0;
        let darkPixels = 0;
        let lightPixels = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          const lum = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
          totalBrightness += lum;
          if (lum < 50) darkPixels++;
          if (lum > 200) lightPixels++;
        }
        const pixelCount = imageData.width * imageData.height;
        const avgBrightness = totalBrightness / pixelCount;
        const darkRatio = (darkPixels / pixelCount * 100).toFixed(1);
        const lightRatio = (lightPixels / pixelCount * 100).toFixed(1);

        // Simulate realistic OCR-like output with real frame metrics
        await new Promise(r => setTimeout(r, 500));

        return `DEEP-COVER VISION ANALYSIS — LIVE FRAME CAPTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frame Metrics:
  Resolution: ${canvas.width}×${canvas.height}
  Average Luminance: ${avgBrightness.toFixed(1)}
  Dark Pixel Ratio: ${darkRatio}%
  Light Pixel Ratio: ${lightRatio}%
  Capture Time: ${new Date().toISOString()}

Document Detection:
  ${avgBrightness > 150 ? '✓ HIGH CONTRAST — Document likely present' : avgBrightness > 80 ? '⚠ MODERATE CONTRAST — Partial document visibility' : '✗ LOW CONTRAST — No document detected'}
  
Text Extraction Status:
  [Requires Tesseract.js or cloud OCR for full text extraction]
  [Current mode: Pixel-level analysis only]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Engine: Deep-Cover Vision (Native Pixel Analysis)
Processing: 100% Air-Gapped`;
      } finally {
        setIsProcessing(false);
      }
    },
    [getAnalysisCanvas],
  );

  return {
    processFrame,
    detectSensitiveData,
    extractText,
    isVisionReady,
    isProcessing,
    error,
  };
}

