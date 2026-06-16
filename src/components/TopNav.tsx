import { useState } from 'react';
import { Bell, Download, Upload } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import ImportModal from './ImportModal';
import { useImportedRoutes } from '../context/ImportedRoutesContext';
import { exportRoutesAsExcel } from '../utils/importData';

export default function TopNav({ onLogout }: { onLogout?: () => void }) {
  const [importOpen, setImportOpen] = useState(false);
  const { importedRoutes, metadata } = useImportedRoutes();

  const handleExport = () => {
    if (importedRoutes.length > 0) {
      exportRoutesAsExcel(importedRoutes);
    }
  };

  return (
    <>
      <header className="topnav-surface sticky top-0 z-10 border-b border-slate-800/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-[#062233] px-3 py-2 text-cyan-300 font-semibold">Enterprise</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Import data button */}
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0EA5E9] px-3 py-2 text-sm font-semibold text-[#0B1220] transition hover:bg-[#0c9ddc]"
            >
              <Upload size={16} />
              Import Data
              {metadata && (
                <span className="ml-0.5 rounded-full bg-[#0B1220]/30 px-1.5 py-0.5 text-[10px]">
                  {metadata.totalRoutes}
                </span>
              )}
            </button>

            {/* Export data button */}
            {importedRoutes.length > 0 && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-md border border-[#0EA5E9]/30 bg-[#0EA5E9]/10 px-3 py-2 text-sm font-semibold text-[#0EA5E9] transition hover:bg-[#0EA5E9]/20"
              >
                <Download size={16} />
                Export Data
              </button>
            )}

            <button aria-label="Notifications" className="rounded-md p-2 hover:bg-[#062233]/40">
              <Bell className="text-cyan-300" />
            </button>

            <ProfileMenu onLogout={onLogout} />
          </div>
        </div>
      </header>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
