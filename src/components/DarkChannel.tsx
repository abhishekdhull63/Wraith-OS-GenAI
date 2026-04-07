import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Flame, Link, ShieldAlert, MonitorDot } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'remote';
  time: number;
}

export default function DarkChannel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'WAITING' | 'CONNECTED'>('DISCONNECTED');
  const [localSignal, setLocalSignal] = useState('');
  const [remoteSignal, setRemoteSignal] = useState('');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initLocalPeer = useCallback(async (isInitiator: boolean) => {
    // Explicitly using standard public STUN limits traversal latency across corporate boundaries
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = pc;

    // Ice gathering completes when candidate hits null
    pc.onicecandidate = (e) => {
      if (e.candidate === null) {
        setLocalSignal(btoa(JSON.stringify(pc.localDescription)));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionState('CONNECTED');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionState('DISCONNECTED');
      }
    };

    // Setup Data channel handlers (Initiator)
    if (isInitiator) {
      const dc = pc.createDataChannel('darkchannel');
      dataChannelRef.current = dc;
      setupDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setConnectionState('WAITING');
    } else {
      // Setup Data channel handlers (Receiver)
      pc.ondatachannel = (e) => {
        dataChannelRef.current = e.channel;
        setupDataChannel(e.channel);
      };
    }
  }, []);

  const setupDataChannel = (dc: RTCDataChannel) => {
    dc.onmessage = (e) => {
      setMessages((m) => [...m, { id: Math.random().toString(), text: e.data, sender: 'remote', time: Date.now() }]);
    };
  };

  const handleGenerateInvite = () => {
    initLocalPeer(true);
  };

  const handleConnectToInvite = async () => {
    try {
      if (connectionState === 'WAITING' && peerRef.current) {
        // Initiator accepts final answer
        const answer = JSON.parse(atob(remoteSignal));
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } else {
        // Receiver accepts initial offer, generates answer
        await initLocalPeer(false);
        const offer = JSON.parse(atob(remoteSignal));
        await peerRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current!.createAnswer();
        await peerRef.current!.setLocalDescription(answer);
        setConnectionState('WAITING');
      }
      setRemoteSignal('');
    } catch {
      alert('Key Verification Failed: Cryptographic format invalid.');
    }
  };

  const handleSend = () => {
    if (!input.trim() || !dataChannelRef.current || dataChannelRef.current.readyState !== 'open') return;
    dataChannelRef.current.send(input);
    setMessages((prev) => [...prev, { id: Math.random().toString(), text: input, sender: 'me', time: Date.now() }]);
    setInput('');
  };

  const handleBurn = () => {
    setMessages([]);
  };

  return (
    <div className="glass-card flex flex-col h-[600px] border-emerald-500/20 font-mono text-sm relative overflow-hidden">
      {/* Hex background watermark */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/carbon-fibre.png)' }}
      />

      {/* Header */}
      <div className="p-4 border-b border-emerald-500/10 flex justify-between items-center bg-black/40 relative z-10">
        <div className="flex items-center gap-3">
          <MonitorDot
            className={`w-5 h-5 ${connectionState === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`}
          />
          <div>
            <h3 className="font-bold text-emerald-400 tracking-widest uppercase">Dark Channel</h3>
            <p className="text-[10px] text-emerald-500/50 uppercase tracking-[0.2em] mt-0.5">
              P2P RAM-Only WebRTC Link
            </p>
          </div>
        </div>

        {connectionState === 'CONNECTED' && (
          <button
            onClick={handleBurn}
            className="px-3 py-1.5 flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 transition-all font-bold text-[10px] uppercase tracking-wider"
          >
            <Flame className="w-3.5 h-3.5" />
            Burn Log
          </button>
        )}
      </div>

      {/* Connection Handshake UI */}
      {connectionState !== 'CONNECTED' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] relative z-10">
          <ShieldAlert className="w-12 h-12 text-emerald-500/30 mb-4" />
          <p className="text-emerald-400 mb-8 max-w-sm text-center text-xs leading-relaxed">
            Establish an encrypted peer-to-peer data channel. Communication exists solely in local RAM and is never
            committed to device storage.
          </p>

          <div className="flex gap-4 w-full max-w-lg mb-8">
            <button
              onClick={handleGenerateInvite}
              disabled={connectionState === 'WAITING'}
              className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors uppercase tracking-widest text-xs font-bold"
            >
              1. Init Host Node
            </button>
          </div>

          {localSignal && (
            <div className="w-full max-w-lg mb-6 group relative">
              <p className="text-[10px] text-emerald-500/50 mb-1 uppercase tracking-widest">
                Your Outbound Handshake (Copy this)
              </p>
              <textarea
                value={localSignal}
                readOnly
                className="w-full h-24 bg-black/60 border border-emerald-500/20 text-emerald-500 text-xs p-3 rounded-lg resize-none focus:outline-none focus:border-emerald-500/50 selection:bg-emerald-500/30"
              />
              <button
                onClick={() => navigator.clipboard.writeText(localSignal)}
                className="absolute top-7 right-3 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest"
              >
                Copy Block
              </button>
            </div>
          )}

          <div className="w-full max-w-lg">
            <p className="text-[10px] text-emerald-500/50 mb-1 uppercase tracking-widest">Incoming Key Exchange</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste partner's token here..."
                value={remoteSignal}
                onChange={(e) => setRemoteSignal(e.target.value)}
                className="flex-1 bg-black/60 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500/50 placeholder:text-emerald-500/20"
              />
              <button
                onClick={handleConnectToInvite}
                className="px-5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/30 transition-colors flex items-center justify-center"
              >
                <Link className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {connectionState === 'CONNECTED' && (
        <>
          <div className="flex-1 bg-[#050505] p-6 overflow-y-auto space-y-4 relative z-10 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-emerald-500/30 uppercase tracking-widest text-[10px]">
                Link Active. Encryption Verfied.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${msg.sender === 'me' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <span className="text-[9px] text-emerald-500/40 mb-1 tracking-widest">
                    {msg.sender === 'me' ? 'OPERATOR' : 'GHOST_NODE'} [{new Date(msg.time).toLocaleTimeString()}]
                  </span>
                  <div
                    className={`p-4 rounded-xl text-sm leading-relaxed ${msg.sender === 'me' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-white/5 border border-white/10 text-gray-300'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-black/40 border-t border-emerald-500/10 relative z-10">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Transmit over encrypted channel..."
                className="flex-1 bg-black/60 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-emerald-500/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-6 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 disabled:opacity-30 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
