import { User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ProfileMenu({ name = 'Lohith', onLogout }: { name?: string; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[#062233]/40">
        <div className="hidden flex-col text-right sm:block">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-cyan-300">Administrator</div>
        </div>
        <div className="rounded-full bg-[#0F172A] p-2 text-[#E2E8F0]">
          <User />
        </div>
        <ChevronDown />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md bg-[#0B1220] p-2 shadow-md border border-[#1E293B]">
          <button className="w-full text-left px-3 py-2 text-sm text-[#E2E8F0] hover:bg-[#11203b] rounded-md">Reports</button>
          <button className="w-full text-left px-3 py-2 text-sm text-[#E2E8F0] hover:bg-[#11203b] rounded-md">Settings</button>
          <button onClick={() => { onLogout?.(); }} className="w-full text-left px-3 py-2 text-sm text-[#E2E8F0] hover:bg-[#11203b] rounded-md">Logout</button>
        </div>
      )}
    </div>
  );
}
