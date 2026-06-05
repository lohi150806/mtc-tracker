import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function KPI({ label, value, delta, icon }: { label: string; value: string; delta?: number; icon?: ReactNode }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-xl bg-[#0B1220] p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-[#94A3B8]">{label}</div>
          <div className="mt-2 text-2xl font-bold text-[#E2E8F0]">{value}</div>
        </div>
        <div className="grid place-items-center rounded-lg bg-[#0F172A] p-2 text-[#E2E8F0]">{icon}</div>
      </div>
      {typeof delta === 'number' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#94A3B8]">
          {positive ? <ArrowUp className="text-emerald-500" /> : <ArrowDown className="text-rose-500" />}
          <span className={`font-semibold ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>{Math.abs(delta)}%</span>
          <span>vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
