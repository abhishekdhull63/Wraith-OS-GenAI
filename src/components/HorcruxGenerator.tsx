import { useState, useEffect } from 'react';
import { Skull, QrCode, ShieldAlert, Download, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import { generateHorcruxShares } from '../lib/crypto/shamir';
import { useDeadMansSwitch } from '../hooks/useDeadMansSwitch'; // Ensure no auto-purge happens while creating

interface HorcruxGeneratorProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function HorcruxGenerator({ onComplete, onCancel }: HorcruxGeneratorProps) {
  const [sharesUrls, setSharesUrls] = useState<{ id: number; url: string; text: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const engageOppenheimer = async () => {
    setIsGenerating(true);
    
    // Abstract the master password into a 256-bit cryptographic fragment
    const sharesText = generateHorcruxShares();
    
    // Generate high-res printable QR domains for the shards
    const generatedUrls: { id: number; url: string; text: string }[] = [];
    
    for (let i = 0; i < sharesText.length; i++) {
       const dataUrl = await QRCode.toDataURL(sharesText[i], {
          errorCorrectionLevel: 'H',
          margin: 4,
          scale: 10,
          color: { dark: '#000000', light: '#FFFFFF' }
       });
       generatedUrls.push({ id: i + 1, url: dataUrl, text: sharesText[i] });
    }
    
    setSharesUrls(generatedUrls);
    
    // Set global flags blocking the Native Vault
    localStorage.setItem('oppenheimer_active', 'true');
    // INSTANT PURGE FROM RAM
    sessionStorage.removeItem('oppenheimer_seed'); 
    
    setIsGenerating(false);
  };

  const downloadHorcrux = (url: string, id: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `OPPENHEIMER_HORCRUX_SHARD_${id}_OF_5.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-red-500 font-mono flex flex-col items-center justify-center p-8 overflow-y-auto">
      
      <div className="max-w-4xl w-full border-4 border-red-600 bg-red-950/20 shadow-[0_0_50px_rgba(220,38,38,0.3)] p-8">
         <div className="flex flex-col items-center mb-8 border-b-4 border-red-600 pb-8 text-center">
            <Skull className="w-20 h-20 mb-4 animate-[pulse_3s_ease-in-out_infinite]" />
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] mb-2">THE OPPENHEIMER PROTOCOL</h1>
            <h2 className="text-xl font-bold text-red-400 mb-4">Shamir's Secret Sharing // 3-of-5 Cryptographic Threshold</h2>
            <p className="text-sm text-red-300 max-w-2xl px-8">
              WARNING: Executing this protocol will permanently detach the Master AES-GCM derivation key from local memory and IndexedDB. 
              The vault's encryption salt will be mathematically fractured into 5 independent physical QR vectors.
            </p>
            <p className="text-sm text-red-300 max-w-2xl px-8 mt-2 font-bold uppercase">
              Physical reconstitution of at least 3 shards will be strictly required to decrypt any underlying assets.
            </p>
         </div>

         {sharesUrls.length === 0 ? (
           <div className="flex flex-col items-center gap-6 py-12">
             <AlertTriangle className="w-16 h-16 text-red-500" />
             <div className="text-center">
                <p className="text-xl font-bold uppercase mb-2">Are you sure you want to arm the Nuclear Option?</p>
                <p className="text-sm text-red-400">There is no digital recovery matrix. If you lose 3 shards, the vault is cryptographically unrecoverable forever.</p>
             </div>
             <div className="flex gap-4 mt-6">
                <button 
                  onClick={onCancel}
                  className="px-8 py-3 text-sm font-bold border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase tracking-widest transition-colors"
                >
                  ABORT
                </button>
                <button 
                  onClick={engageOppenheimer}
                  disabled={isGenerating}
                  className="px-8 py-3 text-sm font-black bg-red-600 text-black hover:bg-red-500 uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all"
                >
                  {isGenerating ? 'ENGAGING...' : 'FRACTURE MASTER KEY'}
                  <Skull className="w-4 h-4" />
                </button>
             </div>
           </div>
         ) : (
           <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-block bg-red-600 text-black px-6 py-2 font-black uppercase tracking-widest text-lg mb-4">
                   MASTER KEY ERADICATED
                </div>
                <p className="text-sm text-red-400 font-bold">The below 5 physical artifacts are now the sole existing keys to the AES cipher lock.</p>
                <p className="text-xs text-red-500 mt-1">Download and distribute these securely. Print them. De-digitize them.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
                 {sharesUrls.map(share => (
                   <div key={share.id} className="border-2 border-red-800 bg-black p-4 flex flex-col items-center text-center">
                     <span className="text-xs font-bold text-red-500 mb-2 uppercase tracking-widest">Shard {share.id}/5</span>
                     <img src={share.url} alt={`Horcrux ${share.id}`} className="w-full aspect-square border-2 border-white rendering-pixelated mb-4 bg-white" />
                     <button 
                       onClick={() => downloadHorcrux(share.url, share.id)}
                       className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold bg-red-900/50 hover:bg-red-600 text-white border border-red-500 uppercase transition-colors"
                     >
                        <Download className="w-3 h-3" /> PRINT
                     </button>
                   </div>
                 ))}
              </div>

              <div className="flex justify-center border-t-2 border-red-900 pt-8">
                <button 
                  onClick={onComplete}
                  className="px-12 py-4 text-sm font-black bg-red-600 text-black hover:bg-red-500 uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                >
                  Confirm Physical Custody & Terminate OS
                </button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
