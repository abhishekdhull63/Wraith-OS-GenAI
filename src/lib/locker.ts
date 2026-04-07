/**
 * locker.ts — Evidence Locker
 * ============================
 * IndexedDB-backed cryptographic evidence vault.
 * All data is stored locally with SHA-256 fingerprints and AES-GCM encryption.
 * Zero cloud. Zero transmission. Tamper-evident by design.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

import { runVDFEngine } from './crypto/temporalLock';

export type EvidenceType = 'TEXT' | 'VOICE' | 'VISION';

export interface SecureEntry {
  id: string;
  timestamp: number;
  /** ENCRYPTED Base64 string */
  content: string;
  type: EvidenceType;
  /** SHA-256 of the unencrypted original text */
  digital_fingerprint: string;
  threat_level: string;
  label: string;
  /** Base64 Initialization Vector used for AES-GCM */
  iv: string;
  /** PBKDF2 salt used for key derivation */
  salt: string;
  /** Self-Destruct trigger (5 min timer starts on render) */
  burnOnRead?: boolean;
  /** Honeytoken flag (triggers silent webcam capture & Panic Blur on open) */
  isHoneytoken?: boolean;
  /** VDF Time-Lock (Temporal Capsule) */
  vdfIterations?: number;
  vdfSeed?: string;
  /** Chronos Geo-Magnetic Lock */
  chronosLat?: number;
  chronosLng?: number;
  chronosHeading?: number;
}

// ─── Cryptography (AES-GCM) ─────────────────────────────────────────────────────

const MASTER_PASSWORD = 'NEXUS-ACTUAL'; // Hardcoded for HackXtreme

export function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const binaryStr = atob(b64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive an AES-GCM crypto key from the master password and a salt.
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  let baseSecret = MASTER_PASSWORD;

  // OPPENHEIMER OVERRIDE:
  if (localStorage.getItem('oppenheimer_active') === 'true') {
    const oppenheimerSeed = sessionStorage.getItem('oppenheimer_seed');
    if (!oppenheimerSeed) {
      throw new Error(
        'OPPENHEIMER LOCKOUT: Master AES Key eradicated from RAM. 3-of-5 Physical Horcrux threshold required for reconstruction.',
      );
    }
    baseSecret = oppenheimerSeed;
  }

  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(baseSecret), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Generate SHA-256 fingerprint of plaintext content
 */
export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt plaintext using AES-GCM
 * Returns { encryptedContent, ivBase64, saltBase64 }
 */
async function encryptVaultContent(
  plaintext: string,
  vdfConfig?: { iterations: number; seedStr: string },
  chronosParams?: { lat: number; lng: number; heading: number },
): Promise<{ ciphertext: string; ivStr: string; saltStr: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let key: CryptoKey;

  if (vdfConfig) {
    const seedBuffer = new TextEncoder().encode(vdfConfig.seedStr).buffer as ArrayBuffer;
    const vdfResultBuffer = await runVDFEngine(seedBuffer, vdfConfig.iterations, () => {});

    const keyMaterial = await crypto.subtle.importKey('raw', vdfResultBuffer, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);
    key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } else {
    const ghostDriveSalt = localStorage.getItem('ghost_drive_hash') || '';
    const encoder = new TextEncoder();

    let chronosString = '';
    if (chronosParams) {
      // Normalize mathematically: Lat/Lng to 4 decimal places (~11m), Heading rounded to nearest 5 degrees
      const cLat = chronosParams.lat.toFixed(4);
      const cLng = chronosParams.lng.toFixed(4);
      const cHdg = Math.round(chronosParams.heading / 5) * 5;
      chronosString = `|CHRONOS|LAT:${cLat}|LNG:${cLng}|HDG:${cHdg}|`;
    }

    const combinedSaltBuffer = new Uint8Array(salt.length + ghostDriveSalt.length + chronosString.length);
    combinedSaltBuffer.set(salt, 0);
    combinedSaltBuffer.set(encoder.encode(ghostDriveSalt), salt.length);
    combinedSaltBuffer.set(encoder.encode(chronosString), salt.length + ghostDriveSalt.length);

    key = await deriveKey(combinedSaltBuffer);
  }

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const encryptedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

  return {
    ciphertext: bufferToBase64(encryptedBuf),
    ivStr: bufferToBase64(iv.buffer),
    saltStr: bufferToBase64(salt.buffer),
  };
}

/**
 * Decrypt cipher text using AES-GCM
 */
export async function decryptVaultContent(
  ciphertextB64: string,
  ivB64: string,
  saltB64: string,
  vdfConfig?: { iterations: number; seedStr: string },
  onVdfProgress?: (pct: number) => void,
  chronosParams?: { lat: number; lng: number; heading: number },
): Promise<string> {
  try {
    const saltBuf = base64ToBuffer(saltB64);
    const ivBuf = base64ToBuffer(ivB64);
    const cipherBuf = base64ToBuffer(ciphertextB64);

    let key: CryptoKey;

    if (vdfConfig) {
      const seedBuffer = new TextEncoder().encode(vdfConfig.seedStr).buffer as ArrayBuffer;
      const vdfResultBuffer = await runVDFEngine(seedBuffer, vdfConfig.iterations, onVdfProgress || (() => {}));

      const keyMaterial = await crypto.subtle.importKey('raw', vdfResultBuffer, 'PBKDF2', false, [
        'deriveBits',
        'deriveKey',
      ]);
      key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new Uint8Array(saltBuf), iterations: 1000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
    } else {
      const ghostDriveSalt = localStorage.getItem('ghost_drive_hash') || '';
      const encoder = new TextEncoder();

      let chronosString = '';
      if (chronosParams) {
        const cLat = chronosParams.lat.toFixed(4);
        const cLng = chronosParams.lng.toFixed(4);
        const cHdg = Math.round(chronosParams.heading / 5) * 5;
        chronosString = `|CHRONOS|LAT:${cLat}|LNG:${cLng}|HDG:${cHdg}|`;
      }

      const combinedSaltBuffer = new Uint8Array(saltBuf.byteLength + ghostDriveSalt.length + chronosString.length);
      combinedSaltBuffer.set(new Uint8Array(saltBuf), 0);
      combinedSaltBuffer.set(encoder.encode(ghostDriveSalt), saltBuf.byteLength);
      combinedSaltBuffer.set(encoder.encode(chronosString), saltBuf.byteLength + ghostDriveSalt.length);

      key = await deriveKey(combinedSaltBuffer);
    }

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuf) as BufferSource },
      key,
      cipherBuf,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuf);
  } catch {
    return '[[ ENCRYPTION ERROR: PAYLOAD CORRUPTED OR TAMPERED ]]';
  }
}

// ─── IndexedDB Helpers ──────────────────────────────────────────────────────────

const DB_NAME = 'deep-cover-evidence-locker';
const DB_VERSION = 2; // Upgraded for encrypted schema
const STORE_NAME = 'secure_entries';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('IntruderLogs')) {
        const store = db.createObjectStore('IntruderLogs', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Encrypt and save evidence to the local vault.
 */
export async function saveToLocker(
  content: string,
  type: EvidenceType,
  threatLevel: string,
  label?: string,
  burnOnRead: boolean = false,
  isHoneytoken: boolean = false,
  vdfIterations?: number,
  vdfSeed?: string,
  chronosLat?: number,
  chronosLng?: number,
  chronosHeading?: number,
): Promise<SecureEntry> {
  const id = `DCH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Fingerprint original text (tamper seal)
  const digital_fingerprint = await generateHash(content);

  // Encrypt payload
  const vdfConfig = vdfIterations && vdfSeed ? { iterations: vdfIterations, seedStr: vdfSeed } : undefined;
  const chronosParams =
    chronosLat !== undefined && chronosLng !== undefined && chronosHeading !== undefined
      ? { lat: chronosLat, lng: chronosLng, heading: chronosHeading }
      : undefined;

  const { ciphertext, ivStr, saltStr } = await encryptVaultContent(content, vdfConfig, chronosParams);

  const entry: SecureEntry = {
    id,
    timestamp: Date.now(),
    content: ciphertext, // STORES EXCLUSIVELY CIPHERTEXT
    type,
    digital_fingerprint,
    threat_level: threatLevel,
    label: label || `${type} Evidence — ${new Date().toLocaleTimeString()}`,
    iv: ivStr,
    salt: saltStr,
    burnOnRead,
    isHoneytoken,
    vdfIterations,
    vdfSeed,
    chronosLat,
    chronosLng,
    chronosHeading,
  };

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  return entry;
}

/**
 * Retrieve all entries, decrypting their content on the fly.
 */
export async function getAllEntries(): Promise<SecureEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).index('timestamp').getAll();
    request.onsuccess = async () => {
      db.close();
      const rawEntries = (request.result as SecureEntry[]).reverse();

      // Decrypt all contents
      const decryptedEntries = await Promise.all(
        rawEntries.map(async (entry) => {
          if (!entry.iv || !entry.salt) return entry; // Legacy fallback

          if (entry.vdfIterations) {
            // Leave content as ciphertext so frontend can spin up VDF Worker and track progress
            return entry;
          }

          const plainText = await decryptVaultContent(entry.content, entry.iv, entry.salt);
          return { ...entry, content: plainText };
        }),
      );

      resolve(decryptedEntries);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Retrieve and decrypt a single entry.
 */
export async function getEntry(id: string): Promise<SecureEntry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = async () => {
      db.close();
      const entry = request.result as SecureEntry | null;
      if (!entry) return resolve(null);
      if (!entry.iv || !entry.salt) return resolve(entry); // Legacy fallback

      if (entry.vdfIterations) {
        return resolve(entry);
      }

      const plainText = await decryptVaultContent(entry.content, entry.iv, entry.salt);
      resolve({ ...entry, content: plainText });
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a single entry by ID.
 */
export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get the total count of entries.
 */
export async function getEntryCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Log an intruder snapshot to the IntruderLogs table.
 */
export async function logIntruder(photoBase64: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('IntruderLogs', 'readwrite');
    const entry = {
      id: `INTRUDE-${Date.now()}`,
      timestamp: Date.now(),
      photo: photoBase64,
    };
    tx.objectStore('IntruderLogs').put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
