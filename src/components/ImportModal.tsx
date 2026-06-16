import { useCallback, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { parseExcel, downloadTemplate, exportRoutesAsExcel } from '../utils/importData';
import { useImportedRoutes } from '../context/ImportedRoutesContext';

const ACCEPTED_TYPES = '.xlsx,.xls';

interface ImportToast {
  type: 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  lines?: string[];
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
    if (t.type !== 'warning') {
      setTimeout(() => setToast(null), 7000);
    }
  };

  const clearToast = () => setToast(null);

  const processFile = useCallback(
    async (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        showToast({
          type: 'error',
          message: `Unsupported file type "${ext}".`,
          detail: 'Accepted formats: .xlsx, .xls',
        });
        return;
      }

      setProcessing(true);

      try {
        const buffer = await file.arrayBuffer();
        const result = parseExcel(buffer, file.name);

        if (result.routes.length === 0) {
          showToast({
            type: 'error',
            message: 'No valid routes found in the file.',
            detail: result.errors[0] ?? 'Ensure the Excel file has the required columns.',
            lines: result.errors.length > 0 ? result.errors : undefined,
          });
          return;
        }

        setImportedData(result.routes, file.name);

        // Build summary toast
        const summaryLines: string[] = [];
        if (result.skipped > 0) {
          summaryLines.push(`${result.skipped} row(s) skipped due to validation errors.`);
        }
        if (result.errors.length > 0) {
          // Only show import/replace messages
          const changeMsgs = result.errors.filter(
            (e) => e.includes('already exists') || e.includes('skipped'),
          );
          summaryLines.push(...changeMsgs);
        }

        showToast({
          type: result.skipped > 0 ? 'warning' : 'success',
          message: `Successfully imported ${result.routes.length} route${result.routes.length !== 1 ? 's' : ''}.`,
          detail: `File: ${file.name}`,
          lines: summaryLines.length > 0 ? summaryLines : undefined,
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

  const handleExport = () => {
    if (importedRoutes.length === 0) {
      showToast({ type: 'error', message: 'No imported data to export. Import an Excel file first.' });
      return;
    }
    exportRoutesAsExcel(importedRoutes);
    showToast({ type: 'success', message: 'Routes exported as Excel file.' });
  };

  if (!open) return null;

  const baseBg = 'bg-[#0B1220]';
  const surfaceBg = 'bg-[#0F172A]';
  const borderCls = 'border-[#1E293B]';
  const textPrimary = 'text-[#E2E8F0]';
  const textMuted = 'text-[#94A3B8]';
  const accent = 'bg-[#0EA5E9]';
  const accentText = 'text-[#0B1220]';
  const dragBorder = dragOver
    ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
    : `border-dashed ${borderCls} bg-[#0A0F1A]`;

  const toastBg =
    toast?.type === 'success'
      ? 'border-emerald-700/60 bg-emerald-950/90 text-emerald-200'
      : toast?.type === 'warning'
        ? 'border-amber-700/60 bg-amber-950/90 text-amber-200'
        : 'border-rose-700/60 bg-rose-950/90 text-rose-200';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-2xl border ${borderCls} ${baseBg} p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${textPrimary}`}>Import Excel Data</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-[#1E293B]">
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
                Drag & drop an Excel file here, or click to browse
              </p>
              <p className={`mt-1 text-xs ${textMuted}`}>
                Supports .xlsx and .xls files
              </p>
            </>
          )}
        </div>

        {/* Download template */}
        <div className="mt-3 text-center">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0EA5E9] transition hover:text-[#0c9ddc]"
          >
            <Download size={14} />
            Download MTC_Routes_Template.xlsx
          </button>
        </div>

        {/* Current import info */}
        {metadata && (
          <div className={`mt-4 rounded-lg border ${borderCls} ${surfaceBg} p-3`}>
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#0EA5E9]" />
              <span className={`text-sm font-semibold ${textPrimary}`}>{metadata.fileName}</span>
            </div>
            <div className={`mt-1.5 text-xs ${textMuted} space-y-0.5`}>
              <div>
                {metadata.totalRoutes} route{metadata.totalRoutes !== 1 ? 's' : ''} imported
              </div>
              <div>
                {new Date(metadata.timestamp).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
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
            onClick={handleExport}
            disabled={fileCount === 0 || processing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0EA5E9]/40 bg-[#0EA5E9]/10 px-4 py-2 text-sm font-semibold text-[#0EA5E9] transition hover:bg-[#0EA5E9]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            Export Data
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

        {/* Expected columns hint */}
        <details className="mt-4">
          <summary
            className={`cursor-pointer text-xs font-semibold uppercase tracking-wide ${textMuted} hover:${textPrimary}`}
          >
            Expected Excel columns
          </summary>
          <div
            className={`mt-2 rounded-lg border ${borderCls} ${surfaceBg} p-3 text-xs leading-relaxed ${textMuted}`}
          >
            <p className="mb-1 font-semibold text-cyan-300">Required columns:</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Bus Number / BusNumber / bus_number</li>
              <li>Source / Start Point / origin</li>
              <li>Destination / End Point / dest</li>
            </ul>
            <p className="mb-1 mt-3 font-semibold text-cyan-300">Optional columns:</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Route Name / Route / route_name</li>
              <li>Stops (comma, semicolon, or pipe separated)</li>
              <li>Distance / dist</li>
              <li>Estimated Duration / duration / time</li>
            </ul>
            <p className="mt-2 text-[10px] opacity-70">
              Column headers are case-insensitive. Spaces and underscores are ignored.
            </p>
          </div>
        </details>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${toastBg}`}
        >
          {toast.type === 'success' ? (
            <Check size={20} className="mt-0.5 shrink-0 text-emerald-300" />
          ) : (
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-300" />
          )}
          <div className="min-w-0">
            <div className="font-semibold">{toast.message}</div>
            {toast.detail && <div className="mt-0.5 text-xs opacity-80">{toast.detail}</div>}
            {toast.lines && toast.lines.length > 0 && (
              <div className="mt-1.5 max-h-32 overflow-y-auto space-y-0.5">
                {toast.lines.map((line, i) => (
                  <div key={i} className="text-[11px] opacity-70 leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={clearToast}
            className="ml-auto shrink-0 rounded p-0.5 hover:bg-black/20"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}