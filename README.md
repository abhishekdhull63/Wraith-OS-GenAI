Live Deployed Link — https://deep-cover-hack-xtream.vercel.app/

# Wraith OS — Deep-Cover Hub

> A stealth-oriented, air-gapped intelligence dashboard and corporate network intrusion detection system. Designed to operate 100% locally in the browser — zero cloud, zero API keys — camouflaged behind ordinary corporate applications.

---

## 🕶️ Overview

**Wraith OS** (codenamed Deep-Cover Hub) is an advanced security and espionage-themed React application built for **HackXtreme 2026**. It offers a comprehensive suite of tools for corporate network intrusion detection, secure peer-to-peer (P2P) data transmission, local AI-powered threat analysis, encrypted telemetry, and autonomous defense protocols — all heavily obfuscated within a fake "corporate" workflow environment.

Whether you are hiding your operations behind a convincing Excel decoy or running local AI threat classification through an air-gapped pipeline, Wraith OS ensures that your intelligence workflow remains undetected, encrypted, and fully isolated from external networks.

---

## ✨ Core Features

### 🏢 Corporate Camouflage (Decoy OS)
The application boots into a **Decoy OS**, presenting itself as mundane office software:
- **Excel Decoy:** A pixel-perfect spreadsheet interface with live title metadata (`Q3_Financial_Report - Excel`), appropriate favicon, branded internal titlebar, and an interactive active cell fill handle crosshair.
- **Logistics Decoy:** A secondary logistical operations decoy screen.
- *Bypass:* To access the real systems, an operator must trigger the hidden system console (Wraith Terminal) and enter the correct authorization sequences.

### 💻 Wraith Terminal (System Console)
A hidden, CRT-styled overlay Command Line Interface (CLI).
- **Activation:** Triggered via <code>`</code> (Backquote/Tilde), `Ctrl+Shift+P`, or triple-clicking the Decoy screen.
- **CRT Phosphor Glow & Scanlines:** Hardware monitor simulation with cyan text-glow and faint LCD scanline overlays for authentic terminal rendering.
- **Live Timestamps:** Real-time clock display on the command input line.
- **Dynamic Interaction:** Retro blinking block cursor that perfectly tracks input, simulated network latency (`[SYSTEM] Processing...`), and automatic scroll-to-bottom.
- **Command History:** Arrow keys (`Up`/`Down`) smoothly navigate through past commands.
- **Easter Eggs & Visual Feedback:** Unauthorized queries (`sudo`, `whoami`) trigger visual "access denied" shakes (`error-shake` animation) and flash red text.

### 🛡️ Zero-Trust Network Intrusion Detection

#### Traffic Anomaly Engine
- **Keyword/Regex threat detection** with trigger-word matching and automated threat level classification (CRITICAL/MINIMAL).
- **Entity Extraction:** Proper noun extraction with stop-word filtering for intelligence entity identification.
- **Auto-Preservation:** Critical detections are automatically saved to the Secure Vault with SHA-256 fingerprinting.

#### Local Log Ingestion & Analysis
- **Air-gapped log file analysis** — upload `.json` or `.txt` log files for 100% local processing.
- **Local regex-based parsing:** Failed login detection, IP extraction, brute-force pattern recognition, port scan identification, privilege escalation detection.
- **AI Classification:** Parsed logs are fed through the local LLM for automated security alert generation.
- **Visual threat dashboard:** Stat cards, suspicious IP frequency tables, event type breakdown, and time range analysis.

#### Threat Analysis Board
- **Network graph visualization** with interactive node inspector for mapping entity relationships and threat connections.

### 🌐 Serverless P2P Communications
True peer-to-peer tunneling without a centralized backend:
- **Dead Drop:** Offline data transfer mechanism using WebRTC protocols. Generates cryptographic Base64 handshakes for manual exchange (e.g., via USB or secure QR).
- **Encrypted Telemetry Log:** Real-time P2P chat interface routed through WebRTC data channels — all data exists entirely in RAM.
- **Dark Channel:** Dedicated secure communication overlay for high-priority comms.

### 🧠 Autonomous & Local Intelligence
- **Local AI Analysis:** Evaluates intelligence payloads completely on-device using `@mlc-ai/web-llm` (SmolLM2) and TensorFlow, preventing any chance of cloud interception.
- **Vault Interrogation:** Secure IndexedDB locker for preserving analyzed intelligence, protected by SHA-256 fingerprinting with full-text search.
- **Shadow Partner:** AI-powered autonomous analysis assistant that runs alongside the operator.
- **Whisper Protocol:** Voice-activated command system using local speech recognition — supports voice-triggered lockdown, dark channel access, and memory wipe.

### 🔐 Cryptographic Evidence Locker (Secure Vault)
- **IndexedDB-backed evidence preservation** with SHA-256 digital fingerprinting.
- **Threat level classification** (CRITICAL, HIGH, MODERATE, LOW) with color-coded indicators.
- **Honeytoken Trap deployment** — plant decoy intelligence to detect unauthorized vault access.
- **Decrypt-to-Analyzer pipeline** — load preserved evidence directly into the Traffic Anomaly Engine.

### 🔒 Extreme OPSEC & Autonomous Defense

#### Dead Man's Switch
- **Two-stage autonomous protection:**
  - **Stage 1:** Inactivity-based system lock after configurable timeout.
  - **Stage 2:** Full data purge (IndexedDB, localStorage, sessionStorage) if operator remains unresponsive.
- **Microscopic burn countdown** displayed in the bottom-right corner.

#### Oppenheimer Protocol (Shamir's Secret Sharing)
- **Horcrux Generator:** Splinters the master encryption key using Shamir's Secret Sharing scheme.
- **Lazarus Unlock:** Reassembly interface requiring a minimum threshold of key fragments to restore system access.

#### Faraday Cage Mode
- **Active network interface monitoring** — triggers instant lockdown if connectivity is detected during air-gapped operations.
- **Automatic enclave shutdown** on Faraday breach.

#### Burn Protocol
- **Zero-Trust data destruction** — one-click purge of all persistent storage.
- **Pattern Lock authentication** — drawing the primary sequence unlocks the dashboard; drawing the duress sequence executes a self-destruct wipe.

#### Biometric Overwatch
- Monitors operator state using local webcam streams.

### 🎨 Immersive UI/UX Polish
A deeply engaging "retro-tactical" visual experience:
- **CRT Phosphor Glow & Scanlines** across terminal interfaces.
- **Glassmorphism design system** with dark-mode palette and backdrop blur effects.
- **Animated boot sequence** with system initialization simulation.
- **Ghost Protocol:** Steganographic message embedding within images.
- **Secure Sketchpad:** Ephemeral drawing canvas for visual intelligence.
- **Conspiracy Board:** Interactive pin-and-string evidence mapping tool.
- **OPSEC Dashboard:** Real-time widget showing motion sensor, Faraday status, and vault encryption state.
- **Intelligence Briefing:** Quick-overview briefing panel in the header.

### 🌐 Collaborative Sidebar Tools
- **New Sketch** — Opens secure ephemeral sketchpad.
- **Conspiracy Board** — Opens interactive evidence connection mapper.
- **Dark Channel** — Opens dedicated encrypted comms overlay.

---

## 🛠️ Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 + TypeScript | Vite 7 bundler |
| **Styling** | Tailwind CSS v4 | Blueprint JS (`@blueprintjs/core`), Lucide React icons |
| **Cryptography** | WebCrypto API | SHA-256, PBKDF2, Shamir's Secret Sharing |
| **P2P Comms** | WebRTC Data Channels | Serverless, RAM-only, encrypted |
| **Local AI (LLM)** | `@mlc-ai/web-llm` (SmolLM2) | Text analysis, threat classification, chat |
| **Local AI (STT)** | Whisper (WASM) | Audio transcription, voice command recognition |
| **Computer Vision** | TensorFlow.js | Local inference pipeline |
| **Storage** | IndexedDB (OPFS) | SHA-256 fingerprinted evidence locker |
| **Audio Processing** | Web Audio API | Whistleblower voice masking (BiquadFilter chain) |
| **QR Codes** | `qrcode` + `jsQR` | Generation and scanning for Dead Drop handshakes |
| **Utilities** | clsx, tailwind-merge | Class composition helpers |

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhishekdhull63/Wraith-OS-GenAI.git
   cd Wraith-OS-GenAI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Open your browser and navigate to `http://localhost:5173`.
   - You will initially be greeted by the **Decoy OS** (Excel spreadsheet).

---

## 📖 Operator Manual

### Accessing the Real Dashboard
1. When presented with the Excel decoy, press <code>`</code> (backtick) or `Ctrl+Shift+P` to reveal the Wraith Terminal drop-down.
2. The CRT-styled terminal overlay will appear from the top of the screen.
3. Type `unlock` and hit Enter.
4. If a Pattern Lock appears, draw the primary sequence to unlock the dashboard. Drawing the duress sequence executes a self-destruct (wipes all databases).

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
| **OPSEC Dashboard** | Motion sensor, Faraday status, vault encryption indicators |
| **Active Mesh Nodes** | Live status of connected network nodes |
| **AI Engines** | Health indicators for LLM (SmolLM2) and STT (Whisper) |
| **Privacy Shield** | Confirmation of local-only processing |
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
│   │   ├── DeepCoverDashboard.tsx # Main intelligence dashboard (1200+ lines)
│   │   ├── WraithTerminal.tsx     # Hidden CRT terminal overlay
│   │   ├── BootSequence.tsx       # Animated system boot sequence
│   │   ├── PatternLock.tsx        # Pattern-based authentication
│   │   ├── SecureVault.tsx        # Cryptographic evidence locker UI
│   │   ├── VaultInterrogation.tsx # Full-text vault search interface
│   │   ├── DeadDrop.tsx           # WebRTC P2P handshake component
│   │   ├── TelemetryLog.tsx       # P2P encrypted chat interface
│   │   ├── GhostProtocol.tsx      # Steganographic message protocol
│   │   ├── DarkChannel.tsx        # Encrypted communication overlay
│   │   ├── LogAnalyzer.tsx        # Air-gapped log ingestion & analysis
│   │   ├── ThreatAnalysisBoard.tsx# Network graph threat visualizer
│   │   ├── ShadowPartner.tsx      # AI autonomous analysis assistant
│   │   ├── HorcruxGenerator.tsx   # Shamir's Secret Sharing key splitter
│   │   ├── LazarusUnlock.tsx      # Key fragment reassembly unlock
│   │   ├── BurnProtocol.tsx       # Zero-Trust data destruction
│   │   ├── DeadMansSwitch.tsx     # Autonomous inactivity protection
│   │   ├── BiometricOverwatch.tsx # Webcam-based operator monitoring
│   │   ├── OpsecDashboard.tsx     # OPSEC telemetry sidebar widget
│   │   ├── NetworkStatus.tsx      # Live network/air-gap indicators
│   │   ├── ConspiracyBoard.tsx    # Evidence pin board
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
│   │   ├── locker.ts              # IndexedDB evidence locker (SHA-256)
│   │   ├── biometrics.ts          # Webcam biometric processing
│   │   ├── steganography.ts       # Image steganography engine
│   │   ├── useWebLLM.ts           # WebLLM integration wrapper
│   │   ├── useFaradayMonitor.ts   # Network monitor tripwire
│   │   ├── usePanicBlur.ts        # Panic screen blur overlay
│   │   ├── crypto/                # Shamir's SSS, pattern locks
│   │   ├── acoustic/              # FSK acoustic modem (emitter/receiver)
│   │   ├── optical/               # QR strobe optical transmitter
│   │   ├── security/              # Security worker threads
│   │   └── runanywhere-sdk/       # Local AI model dynamics
│   └── config/
│       ├── demoData.ts            # Sample intelligence payloads
│       └── prompts.ts             # LLM system prompts
├── app.py                     # Legacy Streamlit backend (Nexus v3.0)
├── PROJECT_PLAN.md            # Architecture & migration roadmap
├── vite.config.ts             # Vite build configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## ⚠️ Disclaimer

**Wraith OS (Deep-Cover Hub)** is a hackathon/concept project designed for **HackXtreme 2026** — built for educational, demonstration, and conceptual purposes regarding UI obfuscation, local-only AI, WebRTC P2P technologies, and air-gapped security workflows. It is a zero-cloud, privacy-first application where all AI inference and data processing occurs entirely within the browser. Please use responsibly and do not rely on it for actual operational security scenarios.
