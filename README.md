# Deep-Cover Hub (Wraith OS)

> A stealth-oriented, off-the-grid intelligence and secure data transmission application. Designed to operate completely locally and peer-to-peer, camouflaged behind ordinary corporate applications.

---

## 🕶️ Overview

**Deep-Cover Hub** (codenamed Wraith OS) is an advanced security and espionage-themed React application. It offers a suite of tools for secure peer-to-peer (P2P) data transmission, local AI intelligence analysis, telemetry logging, and biometric overwatch—all heavily obfuscated within a fake "corporate" workflow environment.

Whether you are hiding your communications behind a fake spreadsheet or leveraging a serverless WebRTC data channel, Deep-Cover Hub ensures that your operations remain undetected, encrypted, and isolated from unauthorized networks.

---

## ✨ Core Features

### 🏢 Corporate Camouflage (Decoy UI)
The application boots into a **Decoy OS**, presenting itself as mundane office software:
- **Excel Decoy:** A functional-looking spreadsheet interface.
- **Teams Decoy:** A blurred video conferencing overlay.
- *Bypass:* To access the real systems, an operator must trigger the hidden system console (Wraith Terminal) and enter the correct authorization sequences.

### 💻 Wraith Terminal (System Console)
A hidden, overlay Command Line Interface (CLI).
- **Activation:** Triggered via <code>`</code> (Backquote/Tilde) or triple-clicking the Decoy screen.
- **Operator Commands:** Use commands like `unlock`, `arm faraday`, `lockdown --burn`, `chronos --calibrate`, and more to interface with stealth modules.

### 🌐 Serverless P2P Communications
True peer-to-peer tunneling without a centralized backend:
- **Dead Drop:** Offline data transfer mechanism using WebRTC protocols. Generates cryptographic Base64 handshakes that you must manually exchange (e.g., via USB or secure QR).
- **Dark Channel & Telemetry Feed:** Real-time encrypted text overlays and P2P chatter that exists entirely in RAM and bypasses all external servers.

### 🧠 Autonomous & Local Intelligence
- **Local AI Analysis:** Evaluates intelligence payloads completely on-device using `@mlc-ai/web-llm` and TensorFlow, preventing any chance of cloud interception.
- **Vault Interrogation:** Secure IndexedDB locker for preserving analyzed intelligence, protected by SHA-256 fingerprinting.
- **Sentient Daemons:** Background monitors analyzing local feeds and ensuring system integrity.

### 🔒 Extreme OPSEC & Dead Man's Switch
- **Faraday Monitor:** Actively watches network interfaces.
- **Biometric Overwatch:** Watches operator state using local webcam streams.
- **Duress Protocol:** If a secondary (duress) pattern is entered into the Pattern Lock, the system immediately evacuates all persistent data, wiping `IndexedDB`, `localStorage`, and `sessionStorage`.

---

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS v4, Blueprint JS (@blueprintjs/core), Lucide React
- **Cryptography & Security:** WebCrypto API, WebRTC Data Channels
- **Local Machine Learning:** TensorFlow.js, WebLLM (@mlc-ai/web-llm)
- **Utilities:** jsQR (QR Code reading), qrcode (QR Code generation), clsx, tailwind-merge

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhishekdhull63/Deep-Cover-HackXtream.git
   cd Deep-Cover-HackXtream
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
   - You will initially be greeted by the **Decoy OS**.

---

## 📖 Operator Manual

### Accessing the Real Dashboard
1. When presented with the Excel decoy, click the hidden drop-down menu by clicking (`) at the top of the spreadsheet to reveal the Wraith Terminal.
2. The drop-down terminal will appear.
3. Type `unlock` and hit enter.
4. If a Pattern Lock appears, drawing the primary sequence unlocks the dashboard. Drawing the duress sequence executes a self-destruct (wipes DBs).

### Wraith Configured Commands
Inside the hidden terminal, type `help` to see operational directives, including:
- `status` - Print active hardware module health.
- `unlock` - Force physical environment decryption.
- `arm faraday` - Isolates radio network interfaces.
- `lockdown --burn` - Executes physical storage destruction (wipes DBs).
- `sonar --transmit [file]` - Engages FSK Acoustic Modem.
- `argus --strobe [file]` - Engages 30 FPS Optical Matrix.
- `shatter --horcrux` - Splinters Master Key via Shamir's Secret Sharing.
- `chronos --calibrate` - Mounts live physical geo-telemetry stream.

---

## ⚠️ Disclaimer

**Deep-Cover Hub** is a hackathon/concept project designed for educational, demonstration, and conceptual purposes regarding UI obfuscation, local-only AI, and WebRTC P2P technologies. Please use responsibly and do not rely on it for actual life-and-death OPSEC scenarios.
