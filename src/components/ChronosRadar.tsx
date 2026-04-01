import { useState, useEffect } from 'react';
import { Compass, Crosshair, MapPin, Unlock, AlertTriangle } from 'lucide-react';
import { ChronosData } from '../hooks/useChronosSensors';

interface ChronosRadarProps {
  sensors: ChronosData;
  targetLat: number;
  targetLng: number;
  targetHeading: number;
  onUnlock: () => void;
  onCancel: () => void;
}

// Haversine formula for extremely rough meters distance approximation between two Lat/Lng coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default function ChronosRadar({ sensors, targetLat, targetLng, targetHeading, onUnlock, onCancel }: ChronosRadarProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [headingDelta, setHeadingDelta] = useState<number | null>(null);

  useEffect(() => {
    if (sensors.lat !== null && sensors.lng !== null) {
       const dist = calculateDistance(sensors.lat, sensors.lng, targetLat, targetLng);
       setDistance(dist);
    }
    if (sensors.heading !== null) {
       let diff = Math.abs(sensors.heading - targetHeading);
       if (diff > 180) diff = 360 - diff;
       setHeadingDelta(diff);
    }
  }, [sensors, targetLat, targetLng, targetHeading]);

  const isLocationLocked = distance !== null && distance <= 15; // 15 meters tolerance
  const isHeadingLocked = headingDelta !== null && headingDelta <= 15; // 15 degrees tolerance
  
  const isArmed = isLocationLocked && isHeadingLocked;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center font-mono">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1)_0%,rgba(0,0,0,0.8)_80%)] pointer-events-none" />
       
       <div className="relative z-10 w-[350px] p-6 border-2 border-emerald-500/30 rounded-full aspect-square flex flex-col items-center justify-center bg-black/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          
          {/* Radar Sweep Animation */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/50 overflow-hidden">
             <div className="w-full h-full bg-gradient-to-tr from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-[spin_4s_linear_infinite]" style={{ transformOrigin: 'center' }} />
          </div>

          <div className="relative z-20 flex flex-col items-center text-center">
             <Crosshair className={`w-12 h-12 mb-4 transition-colors ${isArmed ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,1)]' : 'text-emerald-900'}`} />
             
             <h2 className="text-xl font-black text-emerald-400 tracking-[0.3em] uppercase mb-1">CHRONOS LOCK</h2>
             <p className="text-[10px] text-emerald-500/70 tracking-widest uppercase mb-6">Awaiting spatial alignment</p>

             <div className="w-full space-y-3 text-xs mb-8">
                <div className={`flex items-center justify-between px-4 py-2 rounded border ${isLocationLocked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-black border-red-900/50 text-red-500'}`}>
                   <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> LAT/LNG (15m)</span>
                   <span className="font-bold">{distance !== null ? `${distance.toFixed(1)}m` : 'SCANNING'}</span>
                </div>

                <div className={`flex items-center justify-between px-4 py-2 rounded border ${isHeadingLocked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-black border-red-900/50 text-red-500'}`}>
                   <span className="flex items-center gap-2"><Compass className="w-4 h-4" /> COMPASS (15°)</span>
                   <span className="font-bold">{headingDelta !== null ? `Δ ${headingDelta.toFixed(1)}°` : 'SCANNING'}</span>
                </div>
             </div>

             {sensors.error && (
               <div className="absolute -bottom-12 w-[300px] flex items-center justify-center gap-2 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  {sensors.error}
               </div>
             )}

             <div className="flex gap-3">
                <button 
                  onClick={onCancel}
                  className="px-4 py-2 border border-emerald-900 text-emerald-700 font-bold tracking-widest text-[10px] uppercase hover:bg-emerald-900/30 transition-colors rounded"
                >
                  ABORT
                </button>

                <button 
                  onClick={onUnlock}
                  disabled={!isArmed}
                  className={`flex items-center gap-2 px-6 py-2 font-black tracking-widest text-[11px] uppercase rounded transition-all ${isArmed ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.8)] hover:bg-emerald-400 hover:scale-105' : 'bg-emerald-950 text-emerald-900 border border-emerald-900 cursor-not-allowed'}`}
                >
                  <Unlock className="w-4 h-4" /> RECONSTRUCT ARRAY
                </button>
             </div>
          </div>
       </div>

       {/* HUD Telemetry Corner Overlays */}
       <div className="absolute top-4 left-4 text-emerald-500/50 text-[10px]">
          <div>TGT_LAT: {targetLat.toFixed(4)}</div>
          <div>TGT_LNG: {targetLng.toFixed(4)}</div>
          <div>TGT_HDG: {targetHeading}°</div>
       </div>
       <div className="absolute bottom-4 right-4 text-emerald-500/50 text-[10px] text-right">
          <div>CUR_LAT: {sensors.lat?.toFixed(4) || '---'}</div>
          <div>CUR_LNG: {sensors.lng?.toFixed(4) || '---'}</div>
          <div>CUR_HDG: {sensors.heading?.toFixed(0) || '---'}°</div>
       </div>
    </div>
  );
}
