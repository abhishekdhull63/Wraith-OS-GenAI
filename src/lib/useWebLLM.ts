import { useState, useCallback } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

/**
 * Air-gapped edge inferencing engine for local threat analysis.
 *
 * Initializes and manages a fully client-side LLM (Llama-3-8B-Instruct)
 * via the MLC-AI WebLLM runtime. All model weights are cached in the
 * browser and inference executes entirely on the local GPU through WebGPU,
 * ensuring zero data exfiltration. Supports both one-shot and streaming
 * generation modes for real-time intelligence processing.
 */
export function useWebLLM() {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState<InitProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initEngine = useCallback(async () => {
    if (engine || isInitializing) return;
    setIsInitializing(true);
    setError(null);
    try {
      // Opting for Llama-3-8B-Instruct via the MLC-AI WebLLM module
      const selectedModel = 'Llama-3-8B-Instruct-q4f32_1-MLC';

      const initProgressCallback = (report: InitProgressReport) => {
        setProgress(report);
      };

      const newEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback,
      });
      setEngine(newEngine);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize WebGPU LLM. Is WebGPU enabled on your browser?');
    } finally {
      setIsInitializing(false);
    }
  }, [engine, isInitializing]);

  const generate = useCallback(
    async (prompt: string, onUpdate?: (text: string) => void) => {
      if (!engine) throw new Error('WebGPU Target Engine is Offline or uninitialized.');

      const messages = [{ role: 'user' as const, content: prompt }];

      if (onUpdate) {
        const completion = await engine.chat.completions.create({
          messages,
          stream: true,
        });
        let text = '';
        for await (const chunk of completion) {
          text += chunk.choices[0]?.delta?.content || '';
          onUpdate(text);
        }
        return text;
      } else {
        const completion = await engine.chat.completions.create({
          messages,
        });
        return completion.choices[0]?.message.content || '';
      }
    },
    [engine],
  );

  return { engine, initEngine, isInitializing, progress, error, generate };
}
