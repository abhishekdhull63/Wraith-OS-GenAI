Live Deployed Link — https://deep-cover-hack-xtream.vercel.app/

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
- **Local LLM Inference:** Powered by `@mlc-ai/web-llm`, the data is processed entirely in local RAM. It never touches OpenAI or external APIs.
- **Human-Readable Alerts:** As required by PS-21, the AI instantly flags anomalies (like SSH brute-force attacks) and translates them into plain-English alerts with immediate mitigation steps.

### 2. Serverless P2P Tunnels (WebRTC)
- **Decentralized Topology:** Eliminates the central server vulnerability. Uses WebRTC data channels for encrypted, peer-to-peer data handshakes between office devices.
- **Ransomware Resistant:** Because there is no central database or cloud relay, there is nothing for ransomware to hold hostage.

### 3. Visual Obfuscation Layer (Physical OPSEC)
Network intrusion isn't just digital. In shared small offices, "shoulder surfing" is a massive threat. 
- **Corporate Camouflage:** Wraith OS boots as a decoy Q3 Financial Spreadsheet.
- **Instant Toggle:** Admins can press the \` (Backtick) key to drop the hidden Wraith Terminal over the decoy to view live network telemetry securely. 

---

## 🛠️ Technology Stack

| Layer | Technology | Function |
|-------|-----------|----------|
| **Framework** | React 19 + TypeScript | UI & State Management |
| **Edge Compute AI** | `@mlc-ai/web-llm` | In-browser quantized LLM for log analysis |
| **Cryptography** | WebCrypto API | AES-GCM 256-bit P2P encryption |
| **Networking** | WebRTC Data Channels | Serverless mesh communication |
| **Styling** | Tailwind CSS v4 | Responsive, dark-mode terminal UI |

---

## 🚀 Deployment & Local Setup

Wraith OS is fully browser-native and requires zero backend server configuration to deploy.

**1. Clone the repository:**
\`\`\`bash
git clone https://github.com/YOUR_GITHUB_USERNAME/wraith-os-ps21.git
cd wraith-os-ps21
\`\`\`

**2. Install dependencies:**
\`\`\`bash
npm install
\`\`\`

**3. Start the local edge-compute environment:**
\`\`\`bash
npm run dev
\`\`\`

**4. Run the Platform:**
- Open your browser to `http://localhost:5173`.
- Press \` (Backtick) to drop the Network Terminal over the decoy UI. 
- Navigate to the **Local Log Ingestion** module to test the edge-compute AI with a sample network log.