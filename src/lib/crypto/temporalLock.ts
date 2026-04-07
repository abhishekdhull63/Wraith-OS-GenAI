/**
 * Runs the VDF Proof of Work on a Background Thread.
 * Returns the final ArrayBuffer (the AES Key).
 */
export async function runVDFEngine(
  seed: ArrayBuffer,
  iterations: number,
  onProgress: (pct: number) => void,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    // Vite handles worker paths elegantly using `new URL(...)`
    const worker = new Worker(new URL('./vdfWorker.ts', import.meta.url), { type: 'module' });

    worker.postMessage({ seed, iterations });

    worker.onmessage = (e) => {
      const { type, progress, finalHash, error } = e.data;
      if (type === 'progress') {
        onProgress(progress);
      } else if (type === 'done') {
        worker.terminate();
        resolve(finalHash);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
  });
}
