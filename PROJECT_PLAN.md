# 🛡️ Deep-Cover Hub — Project Plan

> **HackXtreme 2026** · Air-gapped, privacy-first intelligence dashboard for investigative journalists & whistleblowers.
> All AI runs 100% locally in the browser via the **RunAnywhere SDK**. Zero cloud. Zero API keys.

---

## 1. Architecture Overview

### System Diagram

```
┌──────────────────────────────── Browser (Air-Gapped) ───────────────────────────────┐
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        React / TypeScript Frontend                              │  │
│  │                                                                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │  Leak Stream  │  │   Entity     │  │  Secure AI   │  │  Document Vault  │    │  │
│  │  │  (Live Feed)  │  │   Analyzer   │  │  Comms Panel │  │  (File Manager)  │    │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘    │  │
│  │         │                 │                  │                  │                │  │
│  │  ┌──────▼─────────────────▼──────────────────▼──────────────────▼──────────┐    │  │
│  │  │                  RunAnywhere React Hooks Layer                          │    │  │
│  │  │   useLocalLLM()    useWhisperSTT()    useVisionOCR()    useModelLoad() │    │  │
│  │  └──────┬─────────────────┬──────────────────┬──────────────────┬─────────┘    │  │
│  └─────────┼─────────────────┼──────────────────┼──────────────────┼──────────────┘  │
│            │                 │                  │                  │                  │
│  ┌─────────▼─────────────────▼──────────────────▼──────────────────▼──────────────┐  │
│  │                      @runanywhere/web  SDK  (WASM Engine)                      │  │
│  │   ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐     │  │
│  │   │  LLM Engine  │  │  Whisper Engine  │  │  Vision Engine (VLM / OCR)  │     │  │
│  │   │  (LFM2 350M) │  │  (whisper.cpp)   │  │  (LFM2-VL 450M)            │     │  │
│  │   └──────────────┘  └──────────────────┘  └──────────────────────────────┘     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Browser Storage: OPFS (Origin Private File System) — cached models + data      │ │
│  └──────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### How Local AI Connects to React State

1. **SDK Initialization** — On app load, a top-level `<RunAnywhereProvider>` context initializes the `@runanywhere/web` SDK and begins downloading/caching models into the browser's OPFS.
2. **React Hooks Bridge** — Custom hooks (`useLocalLLM`, `useWhisperSTT`, `useVisionOCR`) wrap SDK calls and expose reactive state (`isLoading`, `isModelReady`, `result`, `error`, `progress`).
3. **Streaming Results** — LLM and STT produce streamed output. Hooks use `useState` + callback refs to pipe WASM engine output into React's render cycle in real-time.
4. **Zero Network** — Every inference call stays in-browser via WebAssembly workers. No fetch, no WebSocket, no external calls. The app works fully offline once models are cached.

---

## 2. Component Migration Checklist

Below is the mapping from **Nexus** (emergency response) → **Deep-Cover** (investigative intelligence). For each component, I will **ask you to paste your Nexus code** before refactoring.

| #  | Nexus Component              | Deep-Cover Component          | AI Feature Wired            | Status |
|----|------------------------------|-------------------------------|-----------------------------|--------|
| 1  | **App Shell / Layout**       | Dashboard Shell (dark theme)  | Model status indicators     | ⬜     |
| 2  | **Incident Feed**            | Leak Stream                   | LLM auto-summarization      | ⬜     |
| 3  | **Situation Map / Viz**      | Entity Analyzer / Link Graph  | Vision OCR → entity extract | ⬜     |
| 4  | **Comms Panel / Chat**       | Secure AI Comms               | Local LLM chat (streaming)  | ⬜     |
| 5  | **Audio / Media Panel**      | Whisper Transcription Bay     | Whisper STT (local)         | ⬜     |
| 6  | **Status Bar / Telemetry**   | System Health Monitor         | Model load progress, WASM   | ⬜     |
| 7  | **Document Viewer**          | Document Vault (drag & drop)  | Vision OCR analysis         | ⬜     |
| 8  | **Alerts / Notifications**   | Intel Alerts                  | LLM-triggered anomaly flags | ⬜     |

### Migration Protocol (Per Component)

```
1. I will say: "Please paste your Nexus component code for [X]."
2. You paste the code.
3. I will:
   a. Re-theme it to the Deep-Cover dark-mode palette
   b. Rename props/types/labels to match the intelligence context
   c. Wire it to the appropriate RunAnywhere hook
   d. Add TypeScript types
4. You review, we iterate, then move to the next component.
```

---

## 3. Four-Day Execution Roadmap

### 📅 Day 1 — Foundation (March 19–20)

| Task | Details |
|------|---------|
| ✅ Generate `PROJECT_PLAN.md` | This file — architecture, migration map, roadmap |
| ⬜ Scaffold project | Clone RunAnywhere `web-starter-app` into `/hackxtream`, install deps |
| ⬜ Design system setup | Dark-mode CSS tokens, typography (Inter/JetBrains Mono), glassmorphism variables |
| ⬜ SDK integration layer | Create `RunAnywhereProvider`, `useLocalLLM`, `useWhisperSTT`, `useVisionOCR` hooks |
| ⬜ Migrate: **App Shell** | Ask for Nexus layout → refactor to Deep-Cover dashboard skeleton |

### 📅 Day 2 — Core Intelligence Panels (March 20–21)

| Task | Details |
|------|---------|
| ⬜ Migrate: **Leak Stream** | Incident feed → leak stream with LLM auto-summaries |
| ⬜ Migrate: **Secure AI Comms** | Chat panel → local LLM streaming chat |
| ⬜ Migrate: **Whisper Bay** | Audio panel → drag-drop audio + Whisper transcription |
| ⬜ Wire streaming UI | LLM token-by-token render, STT real-time transcript |

### 📅 Day 3 — Analysis & Vault (March 21–22)

| Task | Details |
|------|---------|
| ⬜ Migrate: **Entity Analyzer** | Situation map → entity extraction + link visualization |
| ⬜ Migrate: **Document Vault** | Document viewer → drag-drop with Vision OCR pipeline |
| ⬜ Migrate: **Intel Alerts** | Alerts panel → LLM-flagged anomaly notifications |
| ⬜ Migrate: **System Health** | Status bar → model load progress + WASM health |

### 📅 Day 4 — Polish & Demo Prep (March 22–23)

| Task | Details |
|------|---------|
| ⬜ End-to-end testing | Full offline flow: upload doc → OCR → summarize → chat |
| ⬜ Performance tuning | Lazy model loading, skeleton states, WebWorker optimization |
| ⬜ Demo script | Record walkthrough; prepare 3-minute pitch narrative |
| ⬜ README + docs | Hackathon submission README with screenshots & architecture |

---

## 4. Design Language — "Deep-Cover"

| Token | Value | Usage |
|-------|-------|-------|
| `--dc-bg-primary` | `#0a0e17` | Main background |
| `--dc-bg-card` | `#111827` | Card/panel surfaces |
| `--dc-bg-elevated` | `#1e293b` | Elevated elements, modals |
| `--dc-accent` | `#22d3ee` | Primary accent (cyan) |
| `--dc-accent-warm` | `#f59e0b` | Warning / alert accent (amber) |
| `--dc-danger` | `#ef4444` | Danger / critical (red) |
| `--dc-success` | `#10b981` | Success / secure (emerald) |
| `--dc-text-primary` | `#f1f5f9` | Primary text |
| `--dc-text-muted` | `#64748b` | Secondary text |
| `--dc-border` | `rgba(255,255,255,0.06)` | Subtle borders |
| `--dc-glass` | `rgba(17,24,39,0.7)` | Glassmorphism panels |
| Font stack | `Inter, system-ui` | Body text |
| Font mono | `JetBrains Mono, monospace` | Code / data displays |

---

## 5. Tech Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 19 + TypeScript | Vite bundler |
| Styling | Tailwind CSS v4 | Inherited from Nexus |
| Icons | lucide-react | Inherited from Nexus |
| AI SDK | `@runanywhere/web` | WASM-powered, fully local |
| LLM | LFM2 350M | Text analysis, chat, summaries |
| STT | Whisper (whisper.cpp) | Audio transcription |
| Vision | LFM2-VL 450M | Document OCR, image analysis |
| Storage | OPFS (browser) | Model caching, zero-server |
| Build | Vite 7 | Fast HMR, production builds |

---

## 6. Verification Plan

### Automated Checks
- `npm run build` — TypeScript compilation must pass with zero errors
- `npm run lint` — ESLint must pass clean

### Browser Testing (Manual, In-App)
1. **Model Loading** — Open app in Chrome 120+, verify all 3 models (LLM, STT, Vision) download and cache. Check OPFS via DevTools → Application → Storage.
2. **LLM Chat** — Type a prompt in Secure AI Comms, verify streamed response appears token-by-token with no external network requests (verify via Network tab).
3. **Whisper STT** — Drag-drop an audio file into Whisper Bay, verify transcript appears.
4. **Vision OCR** — Upload a document image to Document Vault, verify extracted text output.
5. **Offline Mode** — Disable network (DevTools → Network → Offline), reload app, verify all features still work from cached models.
6. **Air-Gap Proof** — During full demo flow, Network tab must show **zero external requests**.

---

> **Next step:** Approve this plan, then we scaffold the project and I'll ask for your first Nexus component.
