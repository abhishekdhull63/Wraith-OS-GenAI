/**
 * LSB Steganography Protocol
 * Injects and extracts encrypted base64 payload strings directly into the
 * Least Significant Bits of an ImageData's RGBA channels.
 */

export function encodeIntelToImage(imageData: ImageData, secretString: string): ImageData {
  // Convert string to bytes
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(secretString);

  // We need to store the length of the string to know when to stop decoding.
  // We'll use the first 32 pixels (32 * 4 = 128 channels) to store a 32-bit integer length.
  // Actually, 32 bits is enough. 1 bit per channel = 32 channels = 8 pixels.
  const length = textBytes.length;
  const lengthBits = length.toString(2).padStart(32, '0');

  // Convert textBytes to bit array
  const textBits: string[] = [];
  for (let i = 0; i < textBytes.length; i++) {
    textBits.push(textBytes[i].toString(2).padStart(8, '0'));
  }
  const payloadBits = lengthBits + textBits.join('');

  const data = imageData.data;

  if (payloadBits.length > data.length) {
    throw new Error('Image too small for this payload size.');
  }

  for (let i = 0; i < payloadBits.length; i++) {
    const bit = parseInt(payloadBits[i], 10);
    // Clear LSB and set it to our bit
    data[i] = (data[i] & 0xfe) | bit;
  }

  return imageData;
}

export function decodeIntelFromImage(imageData: ImageData): string | null {
  const data = imageData.data;

  // Read first 32 bits to get the length
  let lengthBits = '';
  for (let i = 0; i < 32; i++) {
    lengthBits += (data[i] & 1).toString();
  }
  const length = parseInt(lengthBits, 2);

  if (length <= 0 || length * 8 + 32 > data.length) {
    return null; // Invalid length or no payload
  }

  // Read payload bits
  const textBytes = new Uint8Array(length);
  const startOffset = 32;

  for (let i = 0; i < length; i++) {
    let byteBits = '';
    for (let b = 0; b < 8; b++) {
      byteBits += (data[startOffset + i * 8 + b] & 1).toString();
    }
    textBytes[i] = parseInt(byteBits, 2);
  }

  const decoder = new TextDecoder();
  return decoder.decode(textBytes);
}
