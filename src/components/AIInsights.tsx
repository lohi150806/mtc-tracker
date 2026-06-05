import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIInsights() {
  return (
    <motion.section whileHover={{ scale: 1.02 }} className="rounded-xl bg-gradient-to-br from-[#0F172A] to-[#0B1220] p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[#0EA5E9] p-2 text-[#0B1220]">
          <Lightbulb />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#E2E8F0]">AI Insights</div>
          <div className="text-xs text-[#94A3B8]">Automated recommendations from usage patterns</div>
        </div>
      </div>

      <ul className="mt-3 space-y-2 text-sm">
        <li className="rounded-md bg-[#0F172A] p-3 text-[#E2E8F0]">Increase Frequency on Route 12A — predicted +8% revenue</li>
        <li className="rounded-md bg-[#0F172A] p-3 text-[#E2E8F0]">Deploy AC buses on Route 45 during peak hours</li>
      </ul>
    </motion.section>
  );
}
