/**
 * SecureFileDrop.tsx
 * ==================
 * Drag-and-drop file importer for intelligence documents.
 *
 * Accepts .txt, .md, .json files. Reads content locally via the native
 * FileReader API. Zero network, zero dependencies.
 *
 * Drops the extracted text into the Entity Analyzer input.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, X, ShieldCheck } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SecureFileDropProps {
  /** Called with the extracted file text */
  onFileContent: (content: string, filename: string) => void;
  /** Optional log callback */
  onLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => void;
}

const ACCEPTED_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'text/x-markdown',
  'image/jpeg',
  'image/png',
]);

const ACCEPTED_EXTENSIONS = new Set(['.txt', '.md', '.json', '.markdown', '.jpg', '.jpeg', '.png']);

function isAccepted(file: File): boolean {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.has(ext);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function SecureFileDrop({ onFileContent, onLog }: SecureFileDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lastFile, setLastFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isScrubbed, setIsScrubbed] = useState(false);
  const dragCountRef = useRef(0);

  // ── File Processing ─────────────────────────────────────────────────────────
  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setSuccess(false);

      if (!isAccepted(file)) {
        const msg = `Rejected: ${file.name} — only .txt, .md, .json accepted`;
        setError(msg);
        onLog?.('WARNING', `⚠️ ${msg}`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        const msg = `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB — max 5 MB`;
        setError(msg);
        onLog?.('WARNING', `⚠️ ${msg}`);
        return;
      }

      // ── FORENSIC METADATA SCRUBBER ──
      if (file.type.startsWith('image/')) {
        const imgUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const strippedFile = new File([blob], file.name, { type: file.type });
                setSuccess(true);
                setIsScrubbed(true);
                setLastFile({ name: file.name, size: strippedFile.size });
                
                const reader = new FileReader();
                reader.onload = () => {
                  onFileContent(`[IMAGE METADATA SCRUBBED]\nPayload: ${file.name}\nBase64 Payload Hash: ${(reader.result as string).slice(0, 64)}...`, file.name);
                };
                reader.readAsDataURL(strippedFile);

                onLog?.('SUCCESS', `🛡️ EXIF Scrubbed: ${file.name} — Data sanitized for analysis`);
                
                setTimeout(() => {
                  setSuccess(false);
                  setIsScrubbed(false);
                }, 4000);
              }
              URL.revokeObjectURL(imgUrl);
            }, file.type);
          }
        };
        img.src = imgUrl;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setLastFile({ name: file.name, size: file.size });
        setSuccess(true);
        onFileContent(content, file.name);
        onLog?.('SUCCESS', `📁 Imported ${file.name} (${(file.size / 1024).toFixed(1)} KB) — ready for analysis`);

        // Clear success indicator after 3s
        setTimeout(() => setSuccess(false), 3000);
      };
      reader.onerror = () => {
        const msg = `Failed to read ${file.name}`;
        setError(msg);
        onLog?.('ERROR', `❌ ${msg}`);
      };
      reader.readAsText(file);
    },
    [onFileContent, onLog],
  );

  // ── Drag Events ─────────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCountRef.current = 0;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  // ── Click to Upload ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.markdown';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) processFile(file);
    };
    input.click();
  }, [processFile]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative p-4 rounded-xl cursor-pointer
          border-2 border-dashed transition-all duration-300
          flex items-center justify-center gap-3
          group
          ${
            isDragging
              ? 'border-cyan-400/60 bg-cyan-500/[0.06] scale-[1.01]'
              : success
                ? 'border-emerald-500/40 bg-emerald-500/[0.03]'
                : error
                  ? 'border-red-500/30 bg-red-500/[0.02]'
                  : 'border-white/10 bg-white/[0.01] hover:border-cyan-500/25 hover:bg-cyan-500/[0.02]'
          }
        `}
        style={{
          boxShadow: isDragging
            ? '0 0 25px rgba(6,182,212,0.1), inset 0 0 15px rgba(6,182,212,0.03)'
            : 'none',
        }}
      >
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 p-2 rounded-lg transition-colors duration-300
            ${
              isDragging
                ? 'bg-cyan-500/15 text-cyan-400'
                : success
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : error
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-white/5 text-gray-500 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
            }
          `}
        >
          {success ? (
            <CheckCircle className="w-4.5 h-4.5" />
          ) : error ? (
            <AlertTriangle className="w-4.5 h-4.5" />
          ) : isDragging ? (
            <Upload className="w-4.5 h-4.5 animate-bounce" />
          ) : (
            <FileText className="w-4.5 h-4.5" />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex flex-col items-start">
          {isDragging ? (
            <p className="text-sm font-semibold text-cyan-400">
              Drop file to import
            </p>
          ) : success && lastFile ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-emerald-400">
                <span className="font-semibold">{lastFile.name}</span>
                <span className="text-emerald-500/60 text-xs ml-1.5">
                  ({(lastFile.size / 1024).toFixed(1)} KB) ✓ Loaded
                </span>
              </p>
              {isScrubbed && (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded uppercase tracking-widest font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Scrubbed
                </span>
              )}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-red-400 truncate">{error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
              <span className="font-medium text-gray-400 group-hover:text-cyan-400">Drop file</span>
              {' '}or click to import  ·  .txt .md .json .jpg
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
