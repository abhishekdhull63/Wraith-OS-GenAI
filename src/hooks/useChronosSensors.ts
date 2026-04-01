import { useState, useEffect } from 'react';

export interface ChronosData {
  lat: number | null;
  lng: number | null;
  heading: number | null;
  accuracy: number | null;
  error: string | null;
  isCalibrating: boolean;
}

export function useChronosSensors(active: boolean = true) {
  const [data, setData] = useState<ChronosData>({
    lat: null, lng: null, heading: null, accuracy: null, error: null, isCalibrating: true
  });

  useEffect(() => {
    if (!active) return;
    
    let geoId: number | null = null;
    
    // GPS Hook
    if ('geolocation' in navigator) {
       geoId = navigator.geolocation.watchPosition(
          (pos) => {
             setData(prev => ({
                ...prev,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                error: null,
                isCalibrating: prev.heading === null && typeof window.DeviceOrientationEvent !== 'undefined'
             }));
          },
          (err) => {
             setData(prev => ({ ...prev, error: `GPS FAULT: ${err.message}`, isCalibrating: false }));
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
       );
    } else {
       setData(prev => ({ ...prev, error: 'GPS Hardware Not Found.', isCalibrating: false }));
    }

    // Magnetometer Hook
    const handleOrientation = (e: DeviceOrientationEvent) => {
       // 'webkitCompassHeading' for iOS, 'alpha' absolute for Android
       let heading = null;
       
       if ((e as any).webkitCompassHeading !== undefined) {
          heading = (e as any).webkitCompassHeading;
       } else if (e.absolute === true && e.alpha !== null) {
          // e.alpha is 0 at East, anti-clockwise. Convert to compass bearing:
          heading = 360 - e.alpha;
       } else if (e.alpha !== null) {
          heading = 360 - e.alpha; // Fallback
       }
       
       if (heading !== null) {
          setData(prev => ({ ...prev, heading, isCalibrating: prev.lat === null }));
       }
    };

    const initSensors = async () => {
       // Request permission on iOS 13+
       if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
           try {
               const permissionState = await (DeviceOrientationEvent as any).requestPermission();
               if (permissionState === 'granted') {
                   window.addEventListener('deviceorientation', handleOrientation, true);
               } else {
                   setData(prev => ({ ...prev, error: 'Compass Access Denied By User.' }));
               }
           } catch(e) {
               setData(prev => ({ ...prev, error: 'Compass Hardware Fault.' }));
           }
       } else {
           window.addEventListener('deviceorientationabsolute', handleOrientation, true);
           // Fallback if absolute isn't fired
           window.addEventListener('deviceorientation', handleOrientation, true);
       }
    };
    
    initSensors();

    return () => {
       if (geoId !== null) navigator.geolocation.clearWatch(geoId);
       window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
       window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [active]);

  return data;
}
