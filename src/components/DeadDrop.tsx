import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { WifiOff, RadioReceiver, UploadCloud, Copy, Check, ShieldAlert, Terminal } from 'lucide-react';

interface DeadDropProps {
  onLog?: (type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS', message: string) => void;
  /** Called when a message arrives over the WebRTC data channel */
  onMessageReceived?: (text: string) => void;
}

export interface DeadDropHandle {
  /** Send a message over the WebRTC data channel. Returns true on success. */
  sendMessage: (text: string) => boolean;
}

const DeadDrop = forwardRef<DeadDropHandle, DeadDropProps>(function DeadDrop({ onLog, onMessageReceived }, ref) {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [copiedKey, setCopiedKey] = useState<'offer' | 'answer' | null>(null);

  const [localOffer, setLocalOffer] = useState('');
  const [remoteAnswer, setRemoteAnswer] = useState('');
  const [remoteOffer, setRemoteOffer] = useState('');
  const [localAnswer, setLocalAnswer] = useState('');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  // Keep a stable ref to onMessageReceived so the data-channel callback
  // always calls the latest version without re-running setupDataChannel.
  const onMessageReceivedRef = useRef(onMessageReceived);
  useEffect(() => { onMessageReceivedRef.current = onMessageReceived; }, [onMessageReceived]);

  const addTerminalLog = useCallback((msg: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`]);
    if (msg.includes('ESTABLISHED') || msg.includes('FAILED')) {
       onLog?.(msg.includes('FAILED') ? 'ERROR' : 'SUCCESS', `[DEAD DROP] ${msg}`);
    } else {
       onLog?.('INFO', `[DEAD DROP] ${msg}`);
    }
  }, [onLog]);

  // Auto-scroll terminal
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.onopen = () => {
      addTerminalLog('DATA CHANNEL OPEN. DIRECT TUNNEL ESTABLISHED.');
      setConnectionStatus('connected');
    };
    channel.onclose = () => {
      addTerminalLog('DATA CHANNEL CLOSED.');
      setConnectionStatus('disconnected');
    };
    channel.onmessage = (event) => {
      addTerminalLog(`INCOMING ENCRYPTED PAYLOAD [${event.data.length} bytes]`);
      // Route incoming message UP to the dashboard — no local chat state
      onMessageReceivedRef.current?.(event.data);
    };
    channel.onerror = (error) => {
      addTerminalLog(`CHANNEL FATAL ERROR: ${error}`);
      setConnectionStatus('disconnected');
    };
    channelRef.current = channel;
  }, [addTerminalLog]);

  const handleCreateOffer = async () => {
    addTerminalLog('INITIALIZING PEER CONNECTION [INITIATOR]');
    setConnectionStatus('connecting');
    const pc = new RTCPeerConnection({ iceServers: [] });
    peerRef.current = pc;

    const channel = pc.createDataChannel('deaddrop_secure_channel');
    setupDataChannel(channel);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
         addTerminalLog('GATHERING ICE CANDIDATES...');
      } else {
         addTerminalLog('TRICKLE ICE COMPLETE. OFFER READY.');
         setLocalOffer(btoa(JSON.stringify(pc.localDescription)));
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
    } catch (err: any) {
      addTerminalLog(`FAILED TO CREATE OFFER: ${err.message}`);
    }
  };

  const handleAcceptAnswer = async () => {
    if (!peerRef.current || !remoteAnswer.trim()) return;
    addTerminalLog('PARSING REMOTE ANSWER...');
    try {
      const answerDesc = JSON.parse(atob(remoteAnswer.trim()));
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answerDesc));
      addTerminalLog('REMOTE DESCRIPTION APPLIED.');
    } catch (err: any) {
      addTerminalLog(`FAILED TO PARSE ANSWER: ${err.message}`);
    }
  };

  const handleJoinOffer = async () => {
    if (!remoteOffer.trim()) return;
    addTerminalLog('INITIALIZING PEER CONNECTION [RECEIVER]');
    setConnectionStatus('connecting');
    
    const pc = new RTCPeerConnection({ iceServers: [] });
    peerRef.current = pc;

    pc.ondatachannel = (e) => {
      addTerminalLog('INTERCEPTED REMOTE DATA CHANNEL.');
      setupDataChannel(e.channel);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addTerminalLog('GATHERING LOCAL ICE CANDIDATES...');
      } else {
        addTerminalLog('TRICKLE ICE COMPLETE. ANSWER READY.');
        setLocalAnswer(btoa(JSON.stringify(pc.localDescription)));
      }
    };

    try {
      addTerminalLog('PARSING REMOTE OFFER...');
      const offerDesc = JSON.parse(atob(remoteOffer.trim()));
      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
      
      addTerminalLog('GENERATING ANSWER...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
    } catch (err: any) {
       addTerminalLog(`FAILED TO JOIN OFFER: ${err.message}`);
    }
  };

  // ── Send over the data channel (called from parent via ref) ─────────────────
  const sendOverChannel = useCallback((text: string): boolean => {
    if (!channelRef.current || channelRef.current.readyState !== 'open') {
      addTerminalLog('CANNOT SEND: CHANNEL NOT OPEN');
      return false;
    }
    if (!text.trim()) return false;

    try {
      channelRef.current.send(text);
      addTerminalLog(`TRANSMITTED PAYLOAD [${text.length} bytes]`);
      return true;
    } catch (err: any) {
      addTerminalLog(`TRANSMIT FAILED: ${err.message}`);
      return false;
    }
  }, [addTerminalLog]);

  // Expose sendMessage to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage: sendOverChannel,
  }), [sendOverChannel]);

  // Utilities
  const handleCopy = (text: string, type: 'offer' | 'answer') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="glass-card p-6 border-l-4 border-l-orange-500 rounded-xl space-y-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <WifiOff className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              Dead Drop
            </h3>
            <p className="text-xs text-gray-500 font-mono">Offline P2P Data Transfer</p>
          </div>
        </div>
        
        {/* Connection Status Pill */}
        <div className={`px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-widest flex items-center gap-2
            ${connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
              connectionStatus === 'connecting' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
              'bg-gray-800 text-gray-500 border-gray-700'}`}
        >
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse-glow' : connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`}></div>
          {connectionStatus.toUpperCase()}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HANDSHAKE UI — Offer / Answer / Connect  (always shown)
          ═══════════════════════════════════════════════════════════════════════ */}
      {connectionStatus !== 'connected' ? (
        <>
          <div className="flex border-b border-white/10 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'create' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setActiveTab('create')}
            >
              <UploadCloud className="w-4 h-4" />
              CREATE DROP (OFFER)
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'join' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setActiveTab('join')}
            >
              <RadioReceiver className="w-4 h-4" />
              JOIN DROP (ANSWER)
            </button>
          </div>

          <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20 space-y-4">
             <div className="flex items-start gap-2 text-xs text-orange-400/80 mb-2">
               <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
               <p>This protocol bypasses all servers, utilizing a direct WebRTC Data Channel. You must exchange these cryptographic Handshake blocks manually with your peer (e.g. via secure USB, QR code, or an alternate encrypted channel).</p>
             </div>

             {activeTab === 'create' ? (
                <div className="space-y-4 animate-fade-in">
                  <button 
                    onClick={handleCreateOffer}
                    disabled={!!localOffer}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all
                      ${localOffer ? 'bg-gray-800 text-gray-500' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'}
                    `}
                  >
                    1. GENERATE HANDSHAKE OFFER
                  </button>

                  {localOffer && (
                    <div className="space-y-2 animate-slide-up">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Your Offer Block</label>
                        <button onClick={() => handleCopy(localOffer, 'offer')} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                          {copiedKey === 'offer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                        </button>
                      </div>
                      <textarea readOnly value={localOffer} className="w-full h-24 bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-gray-400 outline-none resize-none" />
                    </div>
                  )}

                  {localOffer && (
                    <div className="space-y-2 animate-slide-up pt-4 border-t border-white/5">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-1">2. Paste Peer Answer</label>
                      <textarea 
                        value={remoteAnswer}
                        onChange={(e) => setRemoteAnswer(e.target.value)}
                        placeholder="Paste the Base64 Answer block provided by the receiver..."
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-gray-300 focus:border-orange-500/50 outline-none resize-none"
                      />
                      <button 
                         onClick={handleAcceptAnswer}
                         disabled={!remoteAnswer.trim()}
                         className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                      >
                         CONNECT
                      </button>
                    </div>
                  )}
                </div>
             ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-1">1. Paste Peer Offer</label>
                    <textarea 
                      value={remoteOffer}
                      onChange={(e) => setRemoteOffer(e.target.value)}
                      placeholder="Paste the Base64 Offer block provided by the initiator..."
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-gray-300 focus:border-orange-500/50 outline-none resize-none"
                    />
                    <button 
                       onClick={handleJoinOffer}
                       disabled={!remoteOffer.trim() || !!localAnswer}
                       className="w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                    >
                       GENERATE ANSWER BLOCK
                    </button>
                  </div>

                  {localAnswer && (
                    <div className="space-y-2 animate-slide-up pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">2. Your Answer Block</label>
                        <button onClick={() => handleCopy(localAnswer, 'answer')} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                          {copiedKey === 'answer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                        </button>
                      </div>
                      <textarea readOnly value={localAnswer} className="w-full h-24 bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-gray-400 outline-none resize-none" />
                      <p className="text-[10px] text-gray-500 text-center font-mono pt-2">Provide this block to the Initiator to complete the tunnel.</p>
                    </div>
                  )}
                </div>
             )}
          </div>
        </>
      ) : (
        /* Connected: status confirmation only — chat lives in TelemetryLog */
        <div className="animate-fade-in p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-sm font-mono text-emerald-400 font-bold tracking-wider">
            🔗 P2P TUNNEL ACTIVE
          </p>
          <p className="text-[10px] font-mono text-gray-500 mt-1">
            Use the TELEMETRY FEED below to transmit and receive encrypted payloads.
          </p>
        </div>
      )}

      {/* Terminal Logs */}
      <div className="bg-[#0a0a0f] rounded-xl p-3 border border-white/5 h-32 overflow-y-auto font-mono text-[10px] space-y-1" ref={logsRef}>
         <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-white/5 pb-2">
           <Terminal className="w-3 h-3" />
           <span>P2P TUNNEL LOGS</span>
         </div>
         {terminalLogs.length === 0 ? (
           <div className="text-gray-700 animate-pulse">Awaiting handshake initialization...</div>
         ) : (
           terminalLogs.map((log, idx) => (
             <div key={idx} className={
                 log.includes('ERROR') || log.includes('FAILED') ? 'text-red-400' :
                 log.includes('ESTABLISHED') ? 'text-emerald-400 font-bold' :
                 log.includes('OPEN') || log.includes('TRANSMITTED') || log.includes('INCOMING') ? 'text-cyan-400' :
                 'text-gray-400'
               }>
               {log}
             </div>
           ))
         )}
      </div>
    </div>
  );
});

export default DeadDrop;
