import { Bell } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export default function TopNav({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="topnav-surface sticky top-0 z-10 border-b border-slate-800/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#062233] px-3 py-2 text-cyan-300 font-semibold">Enterprise</div>
        </div>

        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="rounded-md p-2 hover:bg-[#062233]/40">
            <Bell className="text-cyan-300" />
          </button>

          <ProfileMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
