import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SDK_ROOT = resolve(__dirname, 'runanywhere-sdks/sdk/runanywhere-web/packages');

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      // Real RunAnywhere Web SDK — resolve to source TS for Vite compilation
      '@runanywhere/web': resolve(SDK_ROOT, 'core/src/index.ts'),
      '@runanywhere/web-llamacpp': resolve(SDK_ROOT, 'llamacpp/src/index.ts'),
      '@runanywhere/web-onnx': resolve(SDK_ROOT, 'onnx/src/index.ts'),
    },
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (WASM threading for RunAnywhere SDK)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
