export interface KeystrokeEvent {
  key: string;
  type: 'keydown' | 'keyup';
  time: number;
}

export interface BiometricProfile {
  dwellMean: number[];
  dwellStdDev: number[];
  flightMean: number[];
  flightStdDev: number[];
  passwordLength: number;
}

// Calculate generic mean securely
const calculateMean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

// Standard deviation
const calculateStdDev = (arr: number[], mean: number) => {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
};

export class KeystrokeDynamics {
  public events: KeystrokeEvent[] = [];

  public logKeydown(key: string) {
     // Exclude pure modifiers or controls from sequence offsets
     if (key.length !== 1) return; 
     this.events.push({ key, type: 'keydown', time: performance.now() });
  }

  public logKeyup(key: string) {
     if (key.length !== 1) return;
     this.events.push({ key, type: 'keyup', time: performance.now() });
  }

  public clear() {
     this.events = [];
  }

  /**
   * Processes the raw string of events into exact Dwell and Flight pairs.
   * Dwell: keyup - keydown for same key index.
   * Flight: keydown[i] - keyup[i-1].
   */
  public extractFeatures(expectedLength: number): { dwell: number[], flight: number[] } | null {
     const downEvents = this.events.filter(e => e.type === 'keydown');
     const upEvents = this.events.filter(e => e.type === 'keyup');

     // Fallback block if operator types too fast causing event overlap or dropped registers
     if (downEvents.length !== expectedLength) return null;

     const dwell: number[] = [];
     const flight: number[] = [];

     for (let i = 0; i < expectedLength; i++) {
        // Find the absolute first keyup that matches this keydown AFTER the keydown timestamp
        const down = downEvents[i];
        const up = upEvents.find(e => e.key === down.key && e.time > down.time);
        
        let dTime = 100; // default generic fallback
        if (up) {
           dTime = up.time - down.time;
        }
        dwell.push(dTime);

        if (i > 0) {
           // Flight time: current keydown - previous keyup
           const prevUp = upEvents.find(e => e.key === downEvents[i-1].key && e.time > downEvents[i-1].time);
           let fTime = 50;
           if (prevUp) {
               fTime = down.time - prevUp.time;
           } else {
               fTime = down.time - downEvents[i-1].time; // fallback pseudo-flight
           }
           flight.push(fTime);
        }
     }

     return { dwell, flight };
  }
}

export function generateBiometricProfile(samples: { dwell: number[], flight: number[] }[]): BiometricProfile | null {
  if (samples.length < 3) return null;
  
  const expectedLength = samples[0].dwell.length;
  
  const dwellMean: number[] = [];
  const dwellStdDev: number[] = [];
  const flightMean: number[] = [];
  const flightStdDev: number[] = [];

  for (let i = 0; i < expectedLength; i++) {
     const dwellVals = samples.map(s => s.dwell[i]);
     const dMean = calculateMean(dwellVals);
     dwellMean.push(dMean);
     // Minimum std-dev of 15ms to prevent impossible mathematical boundaries rounding to 0
     dwellStdDev.push(Math.max(calculateStdDev(dwellVals, dMean), 15));
  }

  for (let i = 0; i < expectedLength - 1; i++) {
     const flightVals = samples.map(s => s.flight[i]);
     const fMean = calculateMean(flightVals);
     flightMean.push(fMean);
     flightStdDev.push(Math.max(calculateStdDev(flightVals, fMean), 20));
  }

  return {
     dwellMean,
     dwellStdDev,
     flightMean,
     flightStdDev,
     passwordLength: expectedLength
  };
}

export function evaluateZScore(profile: BiometricProfile, attempt: { dwell: number[], flight: number[] }): { isAnomaly: boolean, zScoreMean: number } {
   let totalZ = 0;
   let count = 0;

   // Evaluate Dwell vectors
   for (let i = 0; i < profile.passwordLength; i++) {
       const z = Math.abs((attempt.dwell[i] - profile.dwellMean[i]) / profile.dwellStdDev[i]);
       totalZ += z;
       count++;
   }

   // Evaluate Flight vectors
   for (let i = 0; i < profile.passwordLength - 1; i++) {
       const z = Math.abs((attempt.flight[i] - profile.flightMean[i]) / profile.flightStdDev[i]);
       totalZ += z;
       count++;
   }

   const zScoreMean = totalZ / count;
   // Anomaly if it deviates beyond an average of 2 standard deviations across the entire sequence layer
   const isAnomaly = zScoreMean > 2.0;

   return { isAnomaly, zScoreMean };
}

export const saveBiometricProfile = async (profile: BiometricProfile): Promise<void> => {
   return new Promise((resolve) => {
       const req = indexedDB.open('DeepCoverBiometrics', 1);
       req.onupgradeneeded = (e: any) => {
          e.target.result.createObjectStore('profiles');
       };
       req.onsuccess = (e: any) => {
           try {
              const db = e.target.result;
              const tx = db.transaction('profiles', 'readwrite');
              tx.objectStore('profiles').put(profile, 'phantom_typist');
              tx.oncomplete = () => resolve();
           } catch(err) { resolve(); }
       };
       req.onerror = () => resolve(); // fail silently in extreme limits
   });
};

export const loadBiometricProfile = async (): Promise<BiometricProfile | null> => {
   return new Promise((resolve) => {
       const req = indexedDB.open('DeepCoverBiometrics', 1);
       req.onupgradeneeded = (e: any) => {
          e.target.result.createObjectStore('profiles');
       };
       req.onsuccess = (e: any) => {
           try {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('profiles')) return resolve(null);
              const tx = db.transaction('profiles', 'readonly');
              const getReq = tx.objectStore('profiles').get('phantom_typist');
              getReq.onsuccess = () => resolve(getReq.result || null);
              getReq.onerror = () => resolve(null);
           } catch(err) { resolve(null); }
       };
       req.onerror = () => resolve(null);
   });
};
