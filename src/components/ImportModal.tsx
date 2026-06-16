import { useCallback, useRef, useState } from 'react';
import { AlertCircle, Check, FileSpreadsheet, Upload, X } from 'lucide-react';
import { parseCsv, parseExcel, parseJson } from '../utils/importData';
import { useImportedRoutes } from '../context/ImportedRoutesContext';
import type { ImportedRoute } from '../types';

const ACCEPTED_TYPES = '.csv,.xlsx,.json';
const ACCEPTED_MIME = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
];

interface ImportToast {
  type: 'success' | 'error';
  message: string;
  detail?: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ImportModal({ open, onClose }: Props) {
  const { importedRoutes, metadata, setImportedData, clearImportedData } = useImportedRoutes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<ImportToast | null>(null);

  const fileCount = importedRoutes.length;

  const showToast = (t: ImportToast) => {
    setToast(t);
    setTimeout(() => setToast(null), 5000);
  };

  const processFile = useCallback(
    async (file: File) => {
      // Validate file extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        showToast({
          type: 'error',
          message: `Unsupported file type "${ext}".`,
          detail: `Accepted formats: CSV, XLSX, JSON.`,
        });
        return;
      }

      setProcessing(true);

      try {
        let routes: ImportedRoute[];

        if (ext === '.csv') {
          const text = await file.text();
          routes = parseCsv(text);
        } else if (ext === '.xlsx') {
          const buffer = await file.arrayBuffer();
          routes = parseExcel(buffer);
        } else if (ext === '.json') {
          const text = await file.text();
          routes = parseJson(text);
        } else {
          showToast({ type: 'error', message: 'Unrecognized file format.' });
          return;
        }

        if (routes.length === 0) {
          showToast({
            type: 'error',
            message: 'No valid routes found in the file.',
            detail: 'Ensure each row has busNumber, source, destination, and stops fields.',
          });
          return;
        }

        setImportedData(routes, file.name);
        showToast({
          type: 'success',
          message: `Successfully imported ${routes.length} route${routes.length > 1 ? 's' : ''}.`,
          detail: `File: ${file.name}`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        showToast({ type: 'error', message: 'Import failed.', detail: msg });
      } finally {
        setProcessing(false);
      }
    },
    [setImportedData],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleClear = () => {
    clearImportedData();
    showToast({ type: 'success', message: 'Imported data cleared. Using default mock data.' });
  };

  if (!open) return null;

  /** Light / dark inline variables are driven by the existing theme classes on <body>. */
  const baseBg = 'bg-[#0B1220]';
  const surfaceBg = 'bg-[#0F172A]';
  const borderCls = 'border-[#1E293B]';
  const textPrimary = 'text-[#E2E8F0]';
  const textMuted = 'text-[#94A3B8]';
  const accent = 'bg-[#0EA5E9]';
  const accentText = 'text-[#0B1220]';

  const dragBorder = dragOver ? 'border-[#0EA5E9] bg-[#0EA5E9]/5' : `border-dashed ${borderCls} bg-[#0A0F1A]`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-2xl border ${borderCls} ${baseBg} p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${textPrimary}`}>Import Data</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-[#1E293B]"
          >
            <X size={20} className={textMuted} />
          </button>
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 p-8 text-center transition ${dragBorder}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />

          {processing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0EA5E9] border-t-transparent" />
              <p className={`text-sm ${textMuted}`}>Processing file…</p>
            </div>
          ) : (
            <>
              <Upload size={36} className="mx-auto mb-3 text-[#0EA5E9]" />
              <p className={`text-sm font-semibold ${textPrimary}`}>
                Drag & drop a file here, or click to browse
              </p>
              <p className={`mt-1 text-xs ${textMuted}`}>
                Supports .csv, .xlsx, .json
              </p>
            </>
          )}
        </div>

        {/* Current import info */}
        {metadata && (
          <div className={`mt-4 rounded-lg border ${borderCls} ${surfaceBg} p-3`}>
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#0EA5E9]" />
              <span className={`text-sm font-semibold ${textPrimary}`}>{metadata.fileName}</span>
            </div>
            <div className={`mt-1.5 text-xs ${textMuted} space-y-0.5`}>
              <div>{metadata.totalRoutes} route{metadata.totalRoutes !== 1 ? 's' : ''} imported</div>
              <div>{new Date(metadata.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className={`inline-flex items-center gap-2 rounded-lg ${accent} px-4 py-2 text-sm font-semibold ${accentText} transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Upload size={16} />
            {fileCount > 0 ? 'Re-import' : 'Select File'}
          </button>

          <button
            onClick={handleClear}
            disabled={fileCount === 0 || processing}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-700/50 bg-rose-950/30 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={16} />
            Clear Imported Data
          </button>
        </div>

        {/* Expected schema hint */}
        <details className="mt-4">
          <summary className={`cursor-pointer text-xs font-semibold uppercase tracking-wide ${textMuted} hover:${textPrimary}`}>
            Expected schema
          </summary>
          <pre className={`mt-2 overflow-x-auto rounded-lg border ${borderCls} ${surfaceBg} p-3 text-[11px] leading-relaxed text-cyan-300`}>
{`[
  {
    "busNumber": "21G",
    "source": "Broadway",
    "destination": "Tambaram",
    "stops": "Broadway,Central,Guindy,Tambaram"
  }
]
`}
          </pre>
        </details>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            toast.type === 'success'
              ? 'border-emerald-700/60 bg-emerald-950/90 text-emerald-200'
              : 'border-rose-700/60 bg-rose-950/90 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check size={20} className="mt-0.5 shrink-0 text-emerald-300" />
          ) : (
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-300" />
          )}
          <div>
            <div className="font-semibold">{toast.message}</div>
            {toast.detail && <div className="mt-0.5 text-xs opacity-80">{toast.detail}</div>}
          </div>
        </div>
      )}
    </div>
  );
}