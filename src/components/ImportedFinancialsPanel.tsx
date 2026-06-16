import { useMemo, useState } from 'react';
import {
  BarChart3,
  Bus,
  Download,
  Fuel,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useImportedRoutes } from '../context/ImportedRoutesContext';
import { compactCurrency, number } from '../utils/analytics';
import {
  aggregateImportedFinancials,
  computeAllFinancials,
} from '../utils/importedFinancials';
import { exportRoutesAsExcel } from '../utils/importData';
import type { RouteFinancialResult } from '../types';

function FinancialMetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 shadow-panel">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${tone ?? 'text-cyan-200'}`}>{value}</div>
    </div>
  );
}

function FinancialTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as {
    busNumber: string;
    routeName: string;
    profit: number;
  };
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-3 text-sm text-[#E2E8F0] shadow-lg">
      <div className="font-bold text-[#0EA5E9]">{entry.busNumber}</div>
      <div className="mt-0.5 text-xs text-[#94A3B8]">{entry.routeName}</div>
      <div className="mt-2 flex items-center gap-1 text-xs uppercase tracking-wide text-[#94A3B8]">
        <IndianRupee size={12} /> Profit / Loss
      </div>
      <div
        className={`mt-0.5 font-semibold ${entry.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
      >
        {compactCurrency(entry.profit)}
      </div>
    </div>
  );
}

const statusColor = (profit: number) => (profit >= 0 ? 'text-emerald-400' : 'text-rose-400');
const statusBg = (profit: number) =>
  profit >= 0
    ? 'bg-emerald-950/40 border-emerald-800/40'
    : 'bg-rose-950/40 border-rose-800/40';
const statusLabel = (profit: number) => (profit >= 0 ? 'Profitable' : 'Loss Making');

export default function ImportedFinancialsPanel() {
  const { importedRoutes } = useImportedRoutes();
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'passengers'>('profit');

  const hasData = importedRoutes.length > 0;

  const totals = useMemo(
    () => aggregateImportedFinancials(importedRoutes),
    [importedRoutes],
  );

  const allFinancials = useMemo(() => {
    const computed = computeAllFinancials(importedRoutes);
    if (sortBy === 'revenue') return computed.sort((a, b) => b.revenue - a.revenue);
    if (sortBy === 'passengers') return computed.sort((a, b) => b.passengers - a.passengers);
    return computed; // default is profit-sorted from computeAllFinancials
  }, [importedRoutes, sortBy]);

  const topProfitRoutes = useMemo(
    () => [...allFinancials].sort((a, b) => b.profit - a.profit).slice(0, 15),
    [allFinancials],
  );

  if (!hasData) {
    return (
      <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-6 shadow-panel">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <BarChart3 size={40} className="text-[#1E293B]" />
          <h2 className="text-lg font-bold text-[#E2E8F0]">No Imported Data</h2>
          <p className="max-w-md text-sm text-[#94A3B8]">
            Import an Excel file with route data and financial fields to see computed
            performance metrics here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-[#E2E8F0]">
          Imported Routes — Financial Analysis
        </h2>
        <button
          onClick={() => exportRoutesAsExcel(importedRoutes)}
          className="inline-flex items-center gap-2 rounded-md bg-[#0EA5E9] px-3 py-2 text-sm font-semibold text-[#0B1220] transition hover:bg-[#0c9ddc]"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FinancialMetricCard
          icon={<IndianRupee size={14} />}
          label="Total Revenue"
          value={compactCurrency(totals.revenue)}
        />
        <FinancialMetricCard
          icon={<Fuel size={14} />}
          label="Total Cost"
          value={compactCurrency(totals.totalCost)}
        />
        <FinancialMetricCard
          icon={
            totals.profit >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )
          }
          label="Total Profit / Loss"
          value={compactCurrency(totals.profit)}
          tone={totals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <FinancialMetricCard
          icon={<Users size={14} />}
          label="Monthly Passengers"
          value={number(totals.passengers)}
        />
        <FinancialMetricCard
          icon={<Bus size={14} />}
          label="Routes"
          value={String(totals.routeCount)}
        />
      </div>

      {/* Profitability chart */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Route-wise Profit / Loss
          </h3>
          <div className="flex gap-1">
            {(['profit', 'revenue', 'passengers'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                  sortBy === key
                    ? 'bg-[#0EA5E9] text-[#0B1220]'
                    : 'bg-[#0F172A] text-[#94A3B8] hover:bg-[#11203b]'
                }`}
              >
                {key === 'profit' ? 'Profit' : key === 'revenue' ? 'Revenue' : 'Passengers'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart
              data={topProfitRoutes}
              margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
              barCategoryGap="20%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="busNumber"
                tick={{ fill: '#94A3B8', fontSize: 11, dy: 8 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => compactCurrency(Number(value))}
                width={72}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
              />
              <Tooltip content={<FinancialTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {topProfitRoutes.map((entry, index) => (
                  <Cell
                    key={entry.busNumber + '-' + index}
                    fill={entry.profit >= 0 ? '#16794c' : '#b42318'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route financials table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="bg-[#0F172A] text-left text-xs uppercase tracking-wide text-[#94A3B8]">
            <tr>
              <th className="px-3 py-3">Bus No.</th>
              <th className="px-3 py-3">Route</th>
              <th className="px-3 py-3">Source → Dest</th>
              <th className="px-3 py-3">Revenue</th>
              <th className="px-3 py-3">Cost</th>
              <th className="px-3 py-3">Profit</th>
              <th className="px-3 py-3">Passengers</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {allFinancials.map((route, idx) => {
              const result: RouteFinancialResult = {
                revenue: route.revenue,
                totalCost: route.totalCost,
                profit: route.profit,
                passengers: route.passengers,
              };
              return (
                <tr
                  key={route.busNumber + '-' + idx}
                  className="border-b border-[#1E293B] hover:bg-[#11203b] transition-colors"
                >
                  <td className="px-3 py-3 font-bold text-[#0EA5E9]">{route.busNumber}</td>
                  <td className="px-3 py-3 text-[#E2E8F0]">{route.routeName}</td>
                  <td className="px-3 py-3 text-[#94A3B8]">
                    {route.source} → {route.destination}
                  </td>
                  <td className="px-3 py-3 text-[#E2E8F0]">
                    {compactCurrency(result.revenue)}
                  </td>
                  <td className="px-3 py-3 text-[#94A3B8]">
                    {compactCurrency(result.totalCost)}
                  </td>
                  <td className={`px-3 py-3 font-semibold ${statusColor(result.profit)}`}>
                    {compactCurrency(result.profit)}
                  </td>
                  <td className="px-3 py-3 text-[#E2E8F0]">{number(result.passengers)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBg(result.profit)} ${statusColor(result.profit)}`}
                    >
                      {statusLabel(result.profit)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}