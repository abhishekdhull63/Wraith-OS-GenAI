Live Deployed Link — https://wraith-os-genai.vercel.app/

# Wraith OS — PS-21: Zero-Trust Local Infrastructure

> A lightweight, browser-native Network Intrusion Detection System designed specifically for Small Office Environments (PS-21). It operates 100% locally in the browser — zero cloud servers, zero API keys, and zero data exfiltration risks.

---

## 🛡️ Overview

**Wraith OS** was built for the **NextGen Hackathon 2026** to tackle Problem Statement 21. Small businesses cannot afford $80,000 enterprise SIEM tools, and traditional central routers are massive single points of failure.

Wraith OS bypasses the traditional cloud network entirely. It provides secure peer-to-peer (P2P) office communication, air-gapped network log analysis using local edge-compute AI, and visual obfuscation to protect against physical office intrusions.

---

## ✨ Core Features (PS-21 Alignment)

### 1. Air-Gapped Log Ingestion (Local AI Alerting)
Browsers cannot safely act as raw network packet sniffers. To solve this, Wraith OS features an air-gapped log ingestion engine.
- **How it works:** Admins upload router logs (`.json` or `.txt`) directly into the browser.
- **Local Regex Parsing:** Failed login detection, IP extraction, brute-force pattern recognition, port scan identification, and privilege escalation detection — all processed instantly with zero network calls.
- **Local LLM Inference:** Powered by `@mlc-ai/web-llm`, the data is processed entirely in local RAM. It never touches OpenAI or external APIs.
- **Human-Readable Alerts:** As required by PS-21, the AI instantly flags anomalies (like SSH brute-force attacks) and translates them into plain-English alerts with immediate mitigation steps.
- **Visual Threat Dashboard:** Stat cards, suspicious IP frequency tables, event type breakdown, and time range analysis.

### 2. Traffic Anomaly Engine
- **Keyword/Regex threat detection** with trigger-word matching and automated threat level classification (CRITICAL/MINIMAL).
- **Entity Extraction:** Proper noun extraction with stop-word filtering for intelligence entity identification.
- **Auto-Preservation:** Critical detections are automatically saved to the Secure Vault with SHA-256 fingerprinting.

### 3. Serverless P2P Tunnels (WebRTC)
- **Decentralized Topology:** Eliminates the central server vulnerability. Uses WebRTC data channels for encrypted, peer-to-peer data handshakes between office devices.
- **Dead Drop:** Offline data transfer mechanism using WebRTC protocols. Generates cryptographic Base64 handshakes for manual exchange (e.g., via USB or secure QR).
- **Encrypted Telemetry Log:** Real-time P2P chat interface routed through WebRTC data channels — all data exists entirely in RAM.
- **Ransomware Resistant:** Because there is no central database or cloud relay, there is nothing for ransomware to hold hostage.

### 4. Visual Obfuscation Layer (Physical OPSEC)
Network intrusion isn't just digital. In shared small offices, "shoulder surfing" is a massive threat.
- **Corporate Camouflage:** Wraith OS boots as a decoy Q3 Financial Spreadsheet with pixel-perfect Excel styling, live title metadata, appropriate favicon, and an interactive active cell fill handle.
- **Instant Toggle:** Admins can press the `` ` `` (Backtick) key or `Ctrl+Shift+P` to drop the hidden Wraith Terminal over the decoy to view live network telemetry securely.
- **Pattern Lock:** Drawing the primary sequence unlocks the dashboard; drawing the duress sequence executes a self-destruct wipe of all databases.

### 5. Cryptographic Evidence Locker (Secure Vault)
- **IndexedDB-backed evidence preservation** with SHA-256 digital fingerprinting and AES-GCM 256-bit encryption.
- **Threat level classification** (CRITICAL, HIGH, MODERATE, LOW) with color-coded indicators.
- **Honeytoken Trap deployment** — plant decoy intelligence to detect unauthorized vault access.
- **Vault Interrogation** — full-text search across all preserved evidence entries.

### 6. Autonomous Defense Protocols
- **Dead Man's Switch:** Two-stage inactivity protection — Stage 1 locks the system, Stage 2 purges all data (IndexedDB, localStorage, sessionStorage).
- **Faraday Cage Mode:** Active network interface monitoring — triggers instant lockdown if connectivity is detected during air-gapped operations.
- **Burn Protocol:** Zero-Trust one-click purge of all persistent storage.
- **Whisper Protocol:** Voice-activated command system using browser SpeechRecognition — supports voice-triggered lockdown and memory wipe.
- **Oppenheimer Protocol (FRACTURE KEY):** Splinters the master AES encryption key using Shamir's Secret Sharing scheme into 5 steganographic QR "Horcrux" image shards. Requires 3-of-5 physical fragments to reconstruct via the Lazarus Unlock interface.

### 7. Threat Analysis Board
- **Network graph visualization** with interactive node inspector for mapping entity relationships and threat connections.

---

## 🛠️ Technology Stack

| Layer | Technology | Function |
|-------|-----------|----------|
| **Framework** | React 19 + TypeScript | UI & State Management (Vite 7 bundler) |
| **Edge Compute AI** | `@mlc-ai/web-llm` (SmolLM2) | In-browser quantized LLM for log analysis & threat classification |
| **Speech-to-Text** | Whisper (WASM) | Local audio transcription & voice command recognition |
| **Cryptography** | WebCrypto API | AES-GCM 256-bit encryption, SHA-256, PBKDF2, Shamir's SSS |
| **Networking** | WebRTC Data Channels | Serverless mesh P2P communication |
| **Storage** | IndexedDB | SHA-256 fingerprinted evidence locker |
| **Audio Processing** | Web Audio API | Voice masking via BiquadFilter chain |
| **QR Codes** | `qrcode` + `jsQR` | Dead Drop handshake generation & scanning |
| **Styling** | Tailwind CSS v4 | Responsive, dark-mode terminal UI |
| **UI Components** | Blueprint JS, Lucide React | Enterprise component library & icon system |

---

## 🚀 Deployment & Local Setup

Wraith OS is fully browser-native and requires zero backend server configuration to deploy.

**1. Clone the repository:**
```bash
git clone https://github.com/abhishekdhull63/Wraith-OS-GenAI.git
cd Wraith-OS-GenAI
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start the local edge-compute environment:**
```bash
npm run dev
```

**4. Run the Platform:**
- Open your browser to `http://localhost:5173`.
- Press `` ` `` (Backtick) to drop the Network Terminal over the decoy UI.
- Type `unlock` and hit Enter to access the Intelligence Dashboard.
- Navigate to the **Local Log Ingestion** module to test the edge-compute AI with a sample network log.

---

## 📖 Operator Manual

### Wraith Terminal Commands
Inside the hidden terminal, type `help` to see operational directives:

| Command | Description |
|---------|-------------|
| `help` | Display the command matrix |
| `status` | Print active subsystem health |
| `unlock` | Force physical environment decryption |
| `clear` | Purge terminal display logs |
| `arm faraday` | Isolate radio network interfaces |
| `lockdown --burn` | Execute physical storage destruction (wipes all DBs) |
| `shatter --key-split` | Splinter Master Encryption Key via Shamir's SSC |
| `chronos --sync` | Mount live active mesh node telemetry stream |

### Dashboard Panels (Post-Unlock)

| Panel | Function |
|-------|----------|
| **Traffic Anomaly Engine** | Paste text for local AI threat analysis & entity extraction |
| **Subnet Packet Sniffer** | Secure audio recording with local Whisper transcription + voice masking |
| **Ghost Protocol** | Steganographic message embedding & extraction |
| **Dead Drop** | WebRTC-based P2P handshake & encrypted data tunneling |
| **Encrypted Telemetry Log** | Real-time P2P chat over WebRTC data channels |
| **Threat Analysis Board** | Network graph + entity relationship inspector |
| **Local Log Ingestion** | Upload `.json`/`.txt` logs for air-gapped analysis |
| **Vault Interrogation** | Full-text search across the cryptographic evidence locker |
| **Secure Vault** | SHA-256 fingerprinted evidence preservation & management |
| **Intel Stream** | Real-time operational event log |

### Sidebar Modules

| Module | Function |
|--------|----------|
| **OPSEC Dashboard** | Battery, VRAM, Sentinel Net, Air-Gap Cage, AES-GCM Lock, FRACTURE KEY |
| **Active Mesh Nodes** | Live status of connected network nodes |
| **AI Engines** | Health indicators for LLM (SmolLM2) and STT (Whisper) |
| **Privacy Shield** | Confirmation badge for local-only processing |
| **Burn Protocol** | Zero-Trust data destruction panel |

---

## 📁 Project Structure

```
Wraith-OS-GenAI/
├── index.html                 # Entry point (disguised as Excel)
├── src/
│   ├── App.tsx                # Root app: DecoyOS → Dashboard flow
│   ├── main.tsx               # React entry with error boundary
│   ├── index.css              # Design system (dark-mode tokens, animations)
│   ├── components/
│   │   ├── DecoyOS.tsx            # Decoy OS shell (Excel/Logistics/Pattern Lock)
│   │   ├── ExcelDecoy.tsx         # Pixel-perfect Excel spreadsheet decoy
│   │   ├── LogisticsDecoy.tsx     # Logistics operations decoy
│   │   ├── DeepCoverDashboard.tsx # Main intelligence dashboard
│   │   ├── WraithTerminal.tsx     # Hidden CRT terminal overlay
│   │   ├── BootSequence.tsx       # Animated system boot sequence
│   │   ├── PatternLock.tsx        # Pattern-based authentication
│   │   ├── LogAnalyzer.tsx        # Air-gapped log ingestion & analysis
│   │   ├── ThreatAnalysisBoard.tsx# Network graph threat visualizer
│   │   ├── SecureVault.tsx        # Cryptographic evidence locker UI
│   │   ├── VaultInterrogation.tsx # Full-text vault search interface
│   │   ├── DeadDrop.tsx           # WebRTC P2P handshake component
│   │   ├── TelemetryLog.tsx       # P2P encrypted chat interface
│   │   ├── GhostProtocol.tsx      # Steganographic message protocol
│   │   ├── ShadowPartner.tsx      # AI autonomous analysis assistant
│   │   ├── HorcruxGenerator.tsx   # Shamir's Secret Sharing key splitter
│   │   ├── LazarusUnlock.tsx      # Key fragment reassembly unlock
│   │   ├── BurnProtocol.tsx       # Zero-Trust data destruction
│   │   ├── DeadMansSwitch.tsx     # Autonomous inactivity protection
│   │   ├── BiometricOverwatch.tsx # Webcam-based operator monitoring
│   │   ├── OpsecDashboard.tsx     # OPSEC telemetry sidebar widget
│   │   ├── NetworkStatus.tsx      # Live network/air-gap indicators
│   │   ├── SecureSketchpad.tsx    # Ephemeral drawing canvas
│   │   ├── SecureFileDrop.tsx     # Drag-and-drop file ingestion
│   │   ├── ChronosRadar.tsx       # Geolocation telemetry HUD
│   │   └── ...                    # Additional utility components
│   ├── hooks/
│   │   ├── useSecureIntelligence.ts  # Core AI hook (LLM + STT + tool calling)
│   │   ├── useChronosSensors.ts      # Geolocation & magnetometer APIs
│   │   ├── useDeadMansSwitch.ts      # Two-stage inactivity protection
│   │   ├── useFaradayCage.ts         # Network isolation tripwire
│   │   ├── useWhisperProtocol.ts     # Voice-activated command system
│   │   ├── useSentinelDaemon.ts      # Background integrity monitor
│   │   ├── useGhostDrive.ts          # Steganographic drive operations
│   │   └── useKioskMode.ts           # Full-screen kiosk enforcement
│   ├── lib/
│   │   ├── locker.ts              # IndexedDB evidence locker (SHA-256 + AES-GCM)
│   │   ├── biometrics.ts          # Webcam biometric processing
│   │   ├── steganography.ts       # Image steganography engine
│   │   ├── useWebLLM.ts           # WebLLM integration wrapper
│   │   ├── useFaradayMonitor.ts   # Network monitor tripwire
│   │   ├── usePanicBlur.ts        # Panic screen blur overlay
│   │   ├── crypto/                # Shamir's SSS, AES-GCM, pattern locks
│   │   ├── acoustic/              # FSK acoustic modem (emitter/receiver)
│   │   ├── optical/               # QR strobe optical transmitter
│   │   ├── security/              # Security worker threads
│   │   └── runanywhere-sdk/       # Local AI model dynamics
│   └── config/
│       ├── demoData.ts            # Sample intelligence payloads
│       └── prompts.ts             # LLM system prompts
├── vite.config.ts             # Vite build configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## ⚠️ Disclaimer

**Wraith OS** is a hackathon project built for **NextGen Hackathon 2026 (PS-21)** — designed for educational and demonstration purposes. It showcases browser-native edge-compute AI, WebRTC P2P networking, and air-gapped security workflows. All AI inference and data processing occurs entirely within the browser with zero cloud dependencies.
