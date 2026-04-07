import jsQR from 'jsqr';

self.onmessage = (e: MessageEvent) => {
  const { data, width, height } = e.data;

  if (data) {
    // Attempt to decode the raw pixel matrix
    const code = jsQR(data, width, height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      self.postMessage({ type: 'decoded', text: code.data });
    } else {
      self.postMessage({ type: 'failed' });
    }
  }
};
