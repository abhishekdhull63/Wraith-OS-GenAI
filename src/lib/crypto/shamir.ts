/**
 * PURE WEB-SHAMIR (GF(2^8))
 * Zero external dependencies. Browser native WebCrypto.
 * Implements Lagrange interpolation over Galois Field GF(2^8) (modulus: x^8 + x^4 + x^3 + x^2 + 1 = 0x11D).
 */

const LOG = new Uint8Array(256);
const EXP = new Uint8Array(256);

// Initialize GF(2^8) tables
let primitive = 1;
for (let i = 0; i < 255; i++) {
    EXP[i] = primitive;
    LOG[primitive] = i;
    primitive <<= 1;
    if (primitive & 0x100) {
        primitive ^= 0x11D;
    }
}

function add(a: number, b: number) { return a ^ b; }
function mul(a: number, b: number) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
}
function div(a: number, b: number) {
    if (b === 0) throw new Error('Divide by zero GF(2^8)');
    if (a === 0) return 0;
    return EXP[(LOG[a] - LOG[b] + 255) % 255];
}
function evalPolynomial(poly: Uint8Array, x: number) {
    let result = 0;
    for (let i = poly.length - 1; i >= 0; i--) {
        result = add(mul(result, x), poly[i]);
    }
    return result;
}

function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
        str += bytes[i].toString(16).padStart(2, '0');
    }
    return str;
}

function getRandomBytes(len: number): Uint8Array {
    const buf = new Uint8Array(len);
    window.crypto.getRandomValues(buf);
    return buf;
}

export function share(secretHex: string, numShares: number, threshold: number): string[] {
    const secretBytes = hexToBytes(secretHex);
    const sharesBytes = Array.from({ length: numShares }, () => new Uint8Array(secretBytes.length));
    
    for (let i = 0; i < secretBytes.length; i++) {
        const poly = new Uint8Array(threshold);
        poly[0] = secretBytes[i]; // Secret is the constant term (Y-intercept)
        
        const randomCoeffs = getRandomBytes(threshold - 1);
        for (let j = 1; j < threshold; j++) {
            poly[j] = randomCoeffs[j - 1]; // Randomize other polynomial coefficients
        }
        
        for (let x = 1; x <= numShares; x++) {
            sharesBytes[x - 1][i] = evalPolynomial(poly, x);
        }
    }
    
    // Format: 01<HEX>, 02<HEX> where 01, 02 is the 'x' value (the physical share ID)
    return sharesBytes.map((bytes, idx) => {
        const xHex = (idx + 1).toString(16).padStart(2, '0');
        return xHex + bytesToHex(bytes);
    });
}

export function combine(shares: string[]): string {
    if (shares.length === 0) throw new Error("No shares provided");
    
    const xValues = shares.map(s => parseInt(s.substring(0, 2), 16));
    const sharesBytes = shares.map(s => hexToBytes(s.substring(2)));
    
    const secretLength = sharesBytes[0].length;
    const secretBytes = new Uint8Array(secretLength);
    
    for (let i = 0; i < secretLength; i++) {
        let secretByte = 0;
        // Lagrange interpolation strictly at x = 0 (Y-intercept calculation)
        for (let j = 0; j < shares.length; j++) {
            const xj = xValues[j];
            const yj = sharesBytes[j][i];
            
            let numerator = 1;
            let denominator = 1;
            
            for (let m = 0; m < shares.length; m++) {
                if (j === m) continue;
                const xm = xValues[m];
                
                // (0 - xm) = xm in GF(2^8) space where subtraction == XOR calculation
                numerator = mul(numerator, xm);
                denominator = mul(denominator, add(xj, xm));
            }
            
            const lagrangeBasis = div(numerator, denominator);
            secretByte = add(secretByte, mul(yj, lagrangeBasis));
        }
        secretBytes[i] = secretByte;
    }
    
    return bytesToHex(secretBytes);
}

export function generateHorcruxShares(masterKeyHex?: string): string[] {
    let secretHex = masterKeyHex;
    if (!secretHex) {
        secretHex = bytesToHex(getRandomBytes(32)); // Instantly generate 256 bits fallback 
    }
    return share(secretHex, 5, 3);
}

export function reconstructMasterKey(shares: string[]): string {
    if (shares.length < 3) throw new Error("CRITICAL FAULT: Threshold inherently unmet. Minimum 3 signatures required.");
    try {
        return combine(shares);
    } catch (err: any) {
        throw new Error("RECONSTRUCTION FAILED: Polynomial mathematics collapsed. Shares are invalid. " + err.message);
    }
}
