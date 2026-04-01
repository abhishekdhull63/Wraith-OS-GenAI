/**
 * biometrics.ts
 * =============
 * Identity Protection Layer powered by WebAuthn native browser APIs.
 *
 * Implements a mock registration and assertion flow to trigger the OS-level
 * biometric prompt (TouchID on macOS, Windows Hello, etc.) without needing
 * a real backend server.
 */

// Helper to generate a random 32-byte ArrayBuffer
function generateRandomBuffer(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(32)).buffer;
}

// Convert ArrayBuffer to Base64URL for storage (if needed, though we avoid storage here for full stealth)
export function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Checks if the current browser and device support WebAuthn
 */
export async function checkBiometricSupport(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Trigger an OS-level biometric/hardware authentication prompt.
 * We use a mock credential request. Since we don't have a backend to verify,
 * the simple act of the promise resolving means the OS granted the assertion.
 */
export async function requestBiometricUnlock(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    console.warn('[Biometrics] WebAuthn not supported in this browser.');
    return true; // Fallback for unsupported browsers (allow unlock)
  }

  try {
    const isSupported = await checkBiometricSupport();
    if (!isSupported) {
      console.warn('[Biometrics] Platform authenticator not available.');
      return true; // Fallback
    }

    // ── STEP 1: If no mock credential exists, register one silently ──
    const MOCK_CRED_ID_KEY = 'deep_cover_mock_cred_id';
    let rawIdB64 = localStorage.getItem(MOCK_CRED_ID_KEY);

    if (!rawIdB64) {
      console.log('[Biometrics] Registering initial secure hardware key...');
      const creationOptions: PublicKeyCredentialCreationOptions = {
        challenge: generateRandomBuffer(),
        rp: {
          name: 'NEXUS Secure OS',
          id: window.location.hostname,
        },
        user: {
          id: generateRandomBuffer(),
          name: 'Operator',
          displayName: 'Deep-Cover Operator',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Requires TouchID/FaceID/Hello
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: creationOptions,
      }) as PublicKeyCredential;

      if (!credential) throw new Error('Registration cancelled or failed.');

      // Save the generated rawId to use for future assertions
      rawIdB64 = bufferToBase64URL(credential.rawId);
      localStorage.setItem(MOCK_CRED_ID_KEY, rawIdB64);
    }

    // ── STEP 2: Request Assertion (The actual Unlock) ──
    console.log('[Biometrics] Requesting hardware assertion unlock...');
    
    // We must pass the credential ID we just generated
    const idBuffer = new Uint8Array(
      atob(rawIdB64.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => c.charCodeAt(0))
    ).buffer;

    const requestOptions: PublicKeyCredentialRequestOptions = {
        challenge: generateRandomBuffer(),
        rpId: window.location.hostname,
        allowCredentials: [{
            type: 'public-key',
            id: idBuffer,
        }],
        userVerification: 'required',
        timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: requestOptions,
    });

    return !!assertion; // If promise resolves with an assertion, OS granted unlock

  } catch (err) {
    console.error('[Biometrics] Hardware lock failure or user cancelled:', err);
    return false;
  }
}
