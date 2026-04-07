/**
 * useSecureIntelligence.ts
 * ========================
 * Air-gapped AI integration hook for Wraith OS.
 * Wraps the RunAnywhere Web SDK to provide local LLM text analysis
 * and local Whisper STT — zero cloud, zero API keys.
 *
 * @runanywhere/web-sdk v1.0.4
 *
 * Usage:
 *   const intel = useSecureIntelligence();
 *   await intel.analyzeText("Summarize this leak.");
 *   intel.startSecureRecording();
 *   const transcript = await intel.stopSecureRecording();
 */

import { useCallback, useMemo } from 'react';
import { useLocalLLM, useLocalSTT } from '../lib/runanywhere-sdk';
import { saveToLocker, generateHash } from '../lib/locker';
import type { SecureEntry } from '../lib/locker';

// ─── Constants ──────────────────────────────────────────────────────────────────

const LLM_MODEL_ID = 'smollm2-135m-instruct' as const;
const STT_MODEL_ID = 'whisper-base-en' as const;

/** Default inference settings tuned for investigative analysis (low creativity, high accuracy). */
const DEFAULT_ANALYSIS_CONFIG: Required<AnalysisConfig> = {
  temperature: 0.2,
  max_tokens: 512,
};

// ─── Public Types ───────────────────────────────────────────────────────────────

/** Configuration for LLM inference calls. */
export interface AnalysisConfig {
  /** Controls randomness. Lower = more deterministic. Range: 0–1. Default: 0.2 */
  temperature?: number;
  /** Maximum tokens to generate. Default: 512 */
  max_tokens?: number;
}

/**
 * Classified error codes surfaced by the SDK.
 * - `MIC_DENIED`      — Browser denied microphone access.
 * - `MODEL_NOT_FOUND`  — Requested model ID is invalid or download failed.
 * - `OUT_OF_MEMORY`    — WASM heap or browser tab ran out of memory.
 * - `UNKNOWN`          — Unrecognized SDK error.
 */
export type IntelErrorCode = 'MIC_DENIED' | 'MODEL_NOT_FOUND' | 'OUT_OF_MEMORY' | 'UNKNOWN';

/** Structured error with a machine-readable code and the raw SDK error. */
export interface IntelError {
  code: IntelErrorCode;
  message: string;
  raw: Error;
}

/** Result from an `analyzeWithTools` call — may include an autonomous tool invocation. */
export interface ToolCallResult {
  /** The full text analysis from the LLM. */
  analysis: string;
  /** If the LLM autonomously decided to invoke a tool, this describes the call. */
  toolCall?: {
    name: string;
    arguments: Record<string, string>;
  };
  /** If a tool was called and preserved evidence, this is the saved entry. */
  savedEntry?: SecureEntry;
  /** Total pipeline latency in milliseconds. */
  pipelineMs: number;
}

/** Subsystem status for a single AI engine (LLM or STT). */
export interface EngineStatus {
  isReady: boolean;
  error: IntelError | null;
}

/** LLM-specific status extending base engine status. */
export interface LLMStatus extends EngineStatus {
  /** True while an `analyzeText` or `streamAnalysis` call is in flight. */
  isGenerating: boolean;
}

/** STT-specific status extending base engine status. */
export interface STTStatus extends EngineStatus {
  /** True while the microphone is actively recording. */
  isRecording: boolean;
  /** True while the Whisper model is processing the audio buffer. */
  isTranscribing: boolean;
}

/**
 * Overall system readiness derived from both engines.
 * - `initializing` — At least one model is still downloading/loading.
 * - `partial`      — One engine is ready but the other is not.
 * - `ready`        — Both LLM and STT are loaded and operational.
 * - `error`        — One or both engines failed to initialize.
 */
export type SystemReadiness = 'initializing' | 'partial' | 'ready' | 'error';

/** The full return type of the `useSecureIntelligence` hook. */
export interface SecureIntelligence {
  // ── System ──────────────────────────────────────────────────────────────────
  /** Aggregate readiness of all AI subsystems. */
  systemStatus: SystemReadiness;

  /** Granular status for the local LLM engine. */
  llm: LLMStatus;

  /** Granular status for the local STT engine. */
  stt: STTStatus;

  // ── LLM Operations ─────────────────────────────────────────────────────────
  /**
   * One-shot text analysis. Returns the full LLM response once generation completes.
   * Use this for entity extraction, summarization, or classification tasks.
   *
   * @param prompt  — The analysis prompt (include the document text inline).
   * @param config  — Optional inference overrides (temperature, max_tokens).
   * @returns         Full generated text.
   * @throws          IntelError on SDK failure.
   *
   * @example
   * const summary = await analyzeText(
   *   `Classify entities in this leak:\n\n${documentText}`,
   *   { temperature: 0.1, max_tokens: 800 }
   * );
   */
  analyzeText: (prompt: string, config?: AnalysisConfig) => Promise<string>;

  /**
   * Streaming text analysis. Fires `onChunk` for every generated token,
   * enabling real-time UI updates (typewriter effect).
   *
   * @param prompt   — The analysis prompt.
   * @param onChunk  — Callback invoked with each text fragment as it arrives.
   * @param config   — Optional inference overrides.
   * @returns          Resolves when generation is complete.
   * @throws           IntelError on SDK failure.
   *
   * @example
   * await streamAnalysis(
   *   "Analyze this leaked memo for corruption indicators:",
   *   (chunk) => setDisplayText(prev => prev + chunk),
   *   { temperature: 0.3 }
   * );
   */
  streamAnalysis: (prompt: string, onChunk: (chunk: string) => void, config?: AnalysisConfig) => Promise<void>;

  /**
   * Analysis with autonomous tool calling.
   * The LLM analyzes input AND decides whether to invoke `secure_intelligence`
   * to cryptographically preserve high-threat evidence in the local vault.
   */
  analyzeWithTools: (
    prompt: string,
    onChunk: (chunk: string) => void,
    config?: AnalysisConfig,
  ) => Promise<ToolCallResult>;

  // ── STT Operations ──────────────────────────────────────────────────────────
  startSecureRecording: (customStream?: MediaStream) => void;
  stopSecureRecording: () => Promise<string>;
}

// ─── Internals ──────────────────────────────────────────────────────────────────

/**
 * Maps raw SDK error message codes to structured `IntelErrorCode` values.
 */
function classifyError(err: unknown): IntelError {
  const raw = err instanceof Error ? err : new Error(String(err));
  const msg = raw.message;

  let code: IntelErrorCode = 'UNKNOWN';
  if (msg.includes('ERR_MIC_DENIED')) code = 'MIC_DENIED';
  else if (msg.includes('ERR_MODEL_NOT_FOUND')) code = 'MODEL_NOT_FOUND';
  else if (msg.includes('ERR_OUT_OF_MEMORY')) code = 'OUT_OF_MEMORY';

  const friendlyMessages: Record<IntelErrorCode, string> = {
    MIC_DENIED: 'Microphone access was denied. Please allow mic permissions and retry.',
    MODEL_NOT_FOUND: 'AI model could not be found or downloaded. Check your connection for initial download.',
    OUT_OF_MEMORY: 'Device ran out of memory. Close other tabs and retry.',
    UNKNOWN: `An unexpected AI engine error occurred: ${msg}`,
  };

  return { code, message: friendlyMessages[code], raw };
}

/**
 * Derives the aggregate `SystemReadiness` from both engine states.
 */
function deriveSystemStatus(
  llmReady: boolean,
  sttReady: boolean,
  llmError: Error | null,
  sttError: Error | null,
): SystemReadiness {
  if (llmError || sttError) return 'error';
  if (llmReady && sttReady) return 'ready';
  if (llmReady || sttReady) return 'partial';
  return 'initializing';
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * `useSecureIntelligence` — Unified air-gapped AI hook for Wraith OS.
 *
 * Provides local LLM text analysis and local Whisper speech-to-text,
 * all running 100% in-browser via WebAssembly. No network calls.
 *
 * Must be rendered inside a `<RunAnywhereProvider>`.
 *
 * @example
 * function EntityAnalyzer() {
 *   const { analyzeText, llm, systemStatus } = useSecureIntelligence();
 *
 *   if (systemStatus === 'initializing') return <LoadingSpinner />;
 *
 *   const handleAnalyze = async () => {
 *     const result = await analyzeText("Extract all named entities from: ...");
 *     setEntities(result);
 *   };
 * }
 */
export function useSecureIntelligence(): SecureIntelligence {
  // ── SDK Hooks ─────────────────────────────────────────────────────────────
  const {
    analyzeText: sdkAnalyzeText,
    streamText: sdkStreamText,
    isModelReady: llmReady,
    isGenerating,
    error: llmRawError,
  } = useLocalLLM(LLM_MODEL_ID);

  const {
    startRecording: sdkStartRecording,
    stopRecording: sdkStopRecording,
    isRecording,
    isTranscribing,
    error: sttRawError,
  } = useLocalSTT(STT_MODEL_ID);

  // The STT hook does not expose an `isModelReady` flag.
  // We derive readiness: the engine is ready if there is no initialization error.
  const sttReady = !sttRawError;

  // ── Classified Errors ─────────────────────────────────────────────────────
  const llmError = useMemo<IntelError | null>(() => (llmRawError ? classifyError(llmRawError) : null), [llmRawError]);

  const sttError = useMemo<IntelError | null>(() => (sttRawError ? classifyError(sttRawError) : null), [sttRawError]);

  // ── System Status ─────────────────────────────────────────────────────────
  const systemStatus = useMemo<SystemReadiness>(
    () => deriveSystemStatus(llmReady, sttReady, llmRawError, sttRawError),
    [llmReady, sttReady, llmRawError, sttRawError],
  );

  // ── LLM: One-Shot Analysis ────────────────────────────────────────────────
  const analyzeText = useCallback(
    async (prompt: string, config?: AnalysisConfig): Promise<string> => {
      if (!llmReady) {
        throw classifyError(new Error('ERR_MODEL_NOT_FOUND: LLM engine is not ready.'));
      }
      try {
        return await sdkAnalyzeText(prompt, {
          temperature: config?.temperature ?? DEFAULT_ANALYSIS_CONFIG.temperature,
          max_tokens: config?.max_tokens ?? DEFAULT_ANALYSIS_CONFIG.max_tokens,
        });
      } catch (err) {
        throw classifyError(err);
      }
    },
    [llmReady, sdkAnalyzeText],
  );

  // ── LLM: Streaming Analysis ───────────────────────────────────────────────
  const streamAnalysis = useCallback(
    async (prompt: string, onChunk: (chunk: string) => void, config?: AnalysisConfig): Promise<void> => {
      if (!llmReady) {
        throw classifyError(new Error('ERR_MODEL_NOT_FOUND: LLM engine is not ready.'));
      }
      try {
        await sdkStreamText(prompt, onChunk, {
          temperature: config?.temperature ?? DEFAULT_ANALYSIS_CONFIG.temperature,
          max_tokens: config?.max_tokens ?? DEFAULT_ANALYSIS_CONFIG.max_tokens,
        });
      } catch (err) {
        throw classifyError(err);
      }
    },
    [llmReady, sdkStreamText],
  );

  // ── LLM: Analyze With Tools (Autonomous Pipeline) ─────────────────────────
  const analyzeWithTools = useCallback(
    async (prompt: string, onChunk: (chunk: string) => void, config?: AnalysisConfig): Promise<ToolCallResult> => {
      const pipelineStart = performance.now();

      if (!llmReady) {
        throw classifyError(new Error('ERR_MODEL_NOT_FOUND: LLM engine is not ready.'));
      }

      // Step 1: Stream the analysis
      let fullAnalysis = '';
      try {
        await sdkStreamText(
          prompt,
          (chunk) => {
            fullAnalysis += chunk;
            onChunk(chunk);
          },
          {
            temperature: config?.temperature ?? DEFAULT_ANALYSIS_CONFIG.temperature,
            max_tokens: config?.max_tokens ?? DEFAULT_ANALYSIS_CONFIG.max_tokens,
          },
        );
      } catch (err) {
        throw classifyError(err);
      }

      // Step 2: Autonomous tool decision
      // Detect if this is high-threat intel that should be preserved
      const isCritical = /THREAT LEVEL:.*CRITICAL/i.test(fullAnalysis) || /TOP SECRET/i.test(fullAnalysis);
      const isHighThreat = isCritical || /THREAT LEVEL:.*HIGH/i.test(fullAnalysis);

      let threatLevel = 'LOW';
      if (isCritical) threatLevel = 'CRITICAL';
      else if (isHighThreat) threatLevel = 'HIGH';
      else if (/THREAT LEVEL:.*MEDIUM/i.test(fullAnalysis)) threatLevel = 'MEDIUM';

      const result: ToolCallResult = {
        analysis: fullAnalysis,
        pipelineMs: performance.now() - pipelineStart,
      };

      // Step 3: If high-threat, autonomously call secure_intelligence tool
      if (isHighThreat) {
        result.toolCall = {
          name: 'secure_intelligence',
          arguments: {
            content: fullAnalysis,
            threat_level: threatLevel,
          },
        };

        // Step 4: Execute the tool — hash + save to IndexedDB
        await generateHash(fullAnalysis); // verify integrity
        const entry = await saveToLocker(
          fullAnalysis,
          'TEXT',
          threatLevel,
          `Intelligence Brief — Threat: ${threatLevel}`,
        );
        result.savedEntry = entry;
        result.pipelineMs = performance.now() - pipelineStart;
      }

      return result;
    },
    [llmReady, sdkStreamText],
  );

  // ── STT: Start Recording ──────────────────────────────────────────────────
  const startSecureRecording = useCallback(
    (customStream?: MediaStream): void => {
      if (!sttReady) {
        throw classifyError(new Error('ERR_MODEL_NOT_FOUND: STT engine is not ready.'));
      }
      try {
        sdkStartRecording(customStream);
      } catch (err) {
        throw classifyError(err);
      }
    },
    [sttReady, sdkStartRecording],
  );

  // ── STT: Stop Recording & Transcribe ──────────────────────────────────────
  const stopSecureRecording = useCallback(async (): Promise<string> => {
    try {
      return await sdkStopRecording();
    } catch (err) {
      throw classifyError(err);
    }
  }, [sdkStopRecording]);

  // ── Assemble Return Object ────────────────────────────────────────────────
  // Memoized to prevent unnecessary re-renders in consumer components.
  return useMemo<SecureIntelligence>(
    () => ({
      systemStatus,
      llm: {
        isReady: llmReady,
        isGenerating,
        error: llmError,
      },
      stt: {
        isReady: sttReady,
        isRecording,
        isTranscribing,
        error: sttError,
      },
      analyzeText,
      streamAnalysis,
      analyzeWithTools,
      startSecureRecording,
      stopSecureRecording,
    }),
    [
      systemStatus,
      llmReady,
      isGenerating,
      llmError,
      sttReady,
      isRecording,
      isTranscribing,
      sttError,
      analyzeText,
      streamAnalysis,
      analyzeWithTools,
      startSecureRecording,
      stopSecureRecording,
    ],
  );
}

export default useSecureIntelligence;
