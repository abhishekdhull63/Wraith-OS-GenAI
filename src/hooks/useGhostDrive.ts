import { useState, useCallback } from 'react';

export function useGhostDrive() {
  const [ghostKeyHash, setGhostKeyHash] = useState<string | null>(() => {
    return localStorage.getItem('ghost_drive_hash');
  });

  const bindGhostDrive = useCallback(async () => {
    try {
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API not supported in this browser.');
      }

      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'Any File Key', accept: { '*/*': [] } }],
      });

      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      localStorage.setItem('ghost_drive_hash', hashHex);
      setGhostKeyHash(hashHex);

      return hashHex;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        throw new Error(`Failed to bind physical key: ${err.message}`);
      }
      return null;
    }
  }, []);

  const unbindGhostDrive = useCallback(() => {
    localStorage.removeItem('ghost_drive_hash');
    setGhostKeyHash(null);
  }, []);

  return { ghostKeyHash, bindGhostDrive, unbindGhostDrive };
}
