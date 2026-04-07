import QRCode from 'qrcode';

export interface OpticalChunk {
  index: number;
  total: number;
  dataUrl: string; // Base64 PNG of the QR Code
}

/**
 * Slices an encrypted payload string into smaller segments and generates QR code Image URLs for rapid strobing.
 */
export async function generateOpticalStrobeSequence(payload: string, chunkSize = 150): Promise<OpticalChunk[]> {
  const chunks: OpticalChunk[] = [];
  const totalChunks = Math.ceil(payload.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const rawSegment = payload.substring(i * chunkSize, (i + 1) * chunkSize);
    // Header format: ARGUS|[TOTAL]|[INDEX]|[PAYLOAD]
    const qrText = `ARGUS|${totalChunks}|${i}|${rawSegment}`;

    const dataUrl = await QRCode.toDataURL(qrText, {
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'L', // Low error correction for maximum data capacity and speed
    });

    chunks.push({
      index: i,
      total: totalChunks,
      dataUrl,
    });
  }

  return chunks;
}
