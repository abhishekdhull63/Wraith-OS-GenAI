self.onmessage = async (e: MessageEvent) => {
  const { seed, iterations } = e.data;
  
  try {
    let currentHash = seed;
    
    // We update progress every N iterations so we don't flood the main thread message queue.
    const reportInterval = Math.max(1, Math.floor(iterations / 100));

    for (let i = 0; i < iterations; i++) {
      currentHash = await crypto.subtle.digest('SHA-256', currentHash);
      
      if (i % reportInterval === 0 && i > 0) {
        self.postMessage({ type: 'progress', progress: Math.min(100, (i / iterations) * 100) });
      }
    }

    self.postMessage({ type: 'done', finalHash: currentHash });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
};
