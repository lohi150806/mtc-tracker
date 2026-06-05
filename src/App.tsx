import { BarChart3, Bus, Download, FileSpreadsheet, FileText, Landmark, LockKeyhole, Moon, RefreshCcw, Search, ShieldCheck, Sun, User } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { routes } from './data/routes';
import { govtSchemeUsage } from './data/govtScheme';
import { BusType, Filters, RouteAggregate, SchemeFilters, SchemeUsageRecord } from './types';
import {
  applyFilters,
  compactCurrency,
  currency,
  depotRevenue,
  loadDistribution,
  monthlyTrend,
  number,
  routeTrend,
  totalsFor,
} from './utils/analytics';
import { exportCsv, exportExcel, exportPdf } from './utils/exporters';
import {
  applySchemeFilters,
  depotSchemeUsage,
  monthlySchemeTrend,
  odSchemeUsage,
  schemeTableRows,
  schemeTotals,
  topSchemeRoutes,
} from './utils/schemeAnalytics';

const initialFilters: Filters = { depot: 'All', route: 'All', month: 'All', busType: 'Normal', search: '' };
const initialSchemeFilters: SchemeFilters = { origin: 'All', destination: 'All', route: 'All', month: 'All' };
const busTypes: BusType[] = ['Normal', 'AC'];
const pageSize = 8;
const tooltipCurrency = (value: unknown) => currency(Number(value ?? 0));
const tooltipNumber = (value: unknown) => number(Number(value ?? 0));

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</h2>
      <div className="h-72">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${tone ?? 'text-civic-ink dark:text-white'}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const classes =
    status === 'Profitable'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
      : status === 'Watchlist'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200';

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}

function LoginPage({ dark, onToggleDark, onLogin }: { dark: boolean; onToggleDark: () => void; onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username.trim() === 'lohith' && password === 'admin') {
      setError('');
      onLogin();
      return;
    }

    setError('Not authorized');
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <main className="grid min-h-screen place-items-center bg-civic-mist px-4 py-8 text-civic-ink dark:bg-slate-950 dark:text-slate-100">
        <button
          aria-label="Toggle theme"
          onClick={onToggleDark}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md bg-white text-slate-700 shadow-panel dark:bg-slate-900 dark:text-slate-100"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <section className="w-full max-w-md rounded-[2rem] border border-civic-line/80 bg-white p-7 shadow-panel dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-civic-blue text-white">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold">MTC Dashboard Login</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Authorized access for transport performance analytics</p>
          </div>

          <form onSubmit={submitLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">Username</span>
              <span className="relative block">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-civic-line bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-civic-blue focus:ring-2 focus:ring-civic-blue/20 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-civic-line bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-civic-blue focus:ring-2 focus:ring-civic-blue/20 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </span>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            )}

            <button type="submit" className="w-full rounded-xl bg-civic-blue px-4 py-3 text-sm font-bold text-white transition hover:bg-civic-blue/90">
              Login
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function App() {
  const [dark, setDark] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'scheme' | 'reports'>('dashboard');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<{ key: keyof RouteAggregate; direction: 'asc' | 'desc' }>({ key: 'profit', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState(routes[0].routeNumber);

  const scopedRoutes = useMemo(() => routes.filter((route) => route.busType === filters.busType), [filters.busType]);
  const depots = useMemo(() => ['All', ...Array.from(new Set(scopedRoutes.map((route) => route.depot))).sort()], [scopedRoutes]);
  const routeOptions = useMemo(
    () => ['All', ...scopedRoutes.filter((route) => filters.depot === 'All' || route.depot === filters.depot).map((route) => route.routeNumber)],
    [filters.depot, scopedRoutes],
  );
  const filtered = useMemo(() => applyFilters(routes, filters), [filters]);
  const totals = useMemo(() => totalsFor(filtered), [filtered]);
  const routeProfitability = useMemo(
    () => [...filtered].sort((a, b) => b.profit - a.profit).slice(0, 12).map((route) => ({ route: route.routeNumber, profit: route.profit })),
    [filtered],
  );
  const trend = useMemo(() => monthlyTrend(routes, filters.busType, filters.depot, filters.route), [filters.busType, filters.depot, filters.route]);
  const depotData = useMemo(() => depotRevenue(filtered), [filtered]);
  const loadData = useMemo(() => loadDistribution(filtered), [filtered]);
  const topProfit = useMemo(() => [...filtered].sort((a, b) => b.profit - a.profit).slice(0, 10), [filtered]);
  const topLoss = useMemo(() => [...filtered].sort((a, b) => a.profit - b.profit).slice(0, 10), [filtered]);
  const selectedRouteData = scopedRoutes.find((route) => route.routeNumber === selectedRoute) ?? scopedRoutes[0];

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filtered, sort]);

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    if (!scopedRoutes.some((route) => route.routeNumber === selectedRoute)) {
      setSelectedRoute(scopedRoutes[0]?.routeNumber ?? '');
    }
  }, [scopedRoutes, selectedRoute]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === 'depot' || key === 'busType' ? { route: 'All' } : {}) }));
    setPage(1);
  };

  const toggleSort = (key: keyof RouteAggregate) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (!authenticated) {
    return <LoginPage dark={dark} onToggleDark={() => setDark((value) => !value)} onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <main className="min-h-screen bg-civic-mist text-civic-ink dark:bg-slate-950 dark:text-slate-100">
        <header className="border-b border-civic-line bg-white/95 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-civic-blue text-white">
                <Bus size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">MTC Chennai Route Performance Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Management analytics for route revenue, ridership, and load performance</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-civic-line bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800" aria-label="Bus type">
                {busTypes.map((busType) => (
                  <button
                    key={busType}
                    onClick={() => updateFilter('busType', busType)}
                    className={`min-w-20 rounded-md px-3 py-2 text-sm font-semibold transition ${
                      filters.busType === busType
                        ? 'bg-civic-blue text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {busType}
                  </button>
                ))}
              </div>
              <button onClick={() => setTab('dashboard')} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === 'dashboard' ? 'bg-civic-blue text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                Dashboard
              </button>
              <button onClick={() => setTab('scheme')} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === 'scheme' ? 'bg-civic-blue text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                Govt Scheme
              </button>
              <button onClick={() => setTab('reports')} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === 'reports' ? 'bg-civic-blue text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                Reports
              </button>
              <button aria-label="Toggle theme" onClick={() => setDark((value) => !value)} className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 dark:bg-slate-800">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          {tab !== 'scheme' && (
            <section className="mb-5 grid gap-3 rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <select value={filters.depot} onChange={(event) => updateFilter('depot', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                {depots.map((depot) => <option key={depot}>{depot}</option>)}
              </select>
              <select value={filters.route} onChange={(event) => updateFilter('route', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                {routeOptions.map((route) => <option key={route}>{route}</option>)}
              </select>
              <select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => <option key={month}>{month}</option>)}
              </select>
              <button onClick={() => { setFilters((current) => ({ ...initialFilters, busType: current.busType })); setPage(1); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold dark:bg-slate-800">
                <RefreshCcw size={16} /> Reset Filters
              </button>
            </section>
          )}

          {tab === 'dashboard' ? (
            <>
              <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <MetricCard label="Total Revenue" value={compactCurrency(totals.revenue)} />
                <MetricCard label="Total Cost" value={compactCurrency(totals.cost)} />
                <MetricCard label="Total Profit" value={compactCurrency(totals.profit)} tone={totals.profit >= 0 ? 'text-civic-green' : 'text-civic-red'} />
                <MetricCard label="Avg Load Factor" value={`${totals.loadFactor}%`} />
                <MetricCard label="Total Routes" value={number(totals.routes)} />
                <MetricCard label="Total Passengers" value={number(totals.passengers)} />
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <ChartPanel title="Route-wise Profitability">
                  <ResponsiveContainer>
                    <BarChart data={routeProfitability}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis tickFormatter={compactCurrency} width={70} />
                      <Tooltip formatter={tooltipCurrency} />
                      <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                        {routeProfitability.map((entry) => <Cell key={entry.route} fill={entry.profit >= 0 ? '#16794c' : '#b42318'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>
                <ChartPanel title="Revenue Trend by Month">
                  <ResponsiveContainer>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={compactCurrency} width={70} />
                      <Tooltip formatter={tooltipCurrency} />
                      <Line type="monotone" dataKey="revenue" stroke="#1f5d7a" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="cost" stroke="#c47714" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>
                <ChartPanel title="Depot-wise Revenue">
                  <ResponsiveContainer>
                    <BarChart data={depotData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="depot" interval={0} angle={-18} height={60} />
                      <YAxis tickFormatter={compactCurrency} width={70} />
                      <Tooltip formatter={tooltipCurrency} />
                      <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>
                <ChartPanel title="Load Factor Distribution">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={loadData} dataKey="value" nameKey="name" outerRadius={95} label>
                        {loadData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </section>

              <section className="my-5 grid gap-5 lg:grid-cols-2">
                <RouteList title="Top 10 Profitable Routes" rows={topProfit} />
                <RouteList title="Top 10 Loss-Making Routes" rows={topLoss} />
              </section>

              <section className="rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold">Route Performance Table</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search route" className="w-full rounded-md border border-civic-line bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950 sm:w-56" />
                    </label>
                    <button onClick={() => exportCsv(sorted)} className="inline-flex items-center justify-center gap-2 rounded-md bg-civic-teal px-3 py-2 text-sm font-semibold text-white">
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        {[
                          ['routeNumber', 'Route Number'],
                          ['depot', 'Depot'],
                          ['revenue', 'Revenue'],
                          ['cost', 'Cost'],
                          ['profit', 'Profit'],
                          ['loadFactor', 'Load Factor'],
                          ['status', 'Status'],
                        ].map(([key, label]) => (
                          <th key={key} className="px-3 py-3">
                            <button onClick={() => toggleSort(key as keyof RouteAggregate)} className="font-semibold">{label}</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((route) => (
                        <tr key={route.routeNumber} onClick={() => setSelectedRoute(route.routeNumber)} className="cursor-pointer border-b border-civic-line/70 hover:bg-civic-mist dark:border-slate-800 dark:hover:bg-slate-800/70">
                          <td className="px-3 py-3">
                            <div className="font-bold text-civic-blue dark:text-cyan-300">{route.routeNumber}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{route.routeName}</div>
                          </td>
                          <td className="px-3 py-3">{route.depot}</td>
                          <td className="px-3 py-3">{compactCurrency(route.revenue)}</td>
                          <td className="px-3 py-3">{compactCurrency(route.cost)}</td>
                          <td className={`px-3 py-3 font-semibold ${route.profit >= 0 ? 'text-civic-green' : 'text-civic-red'}`}>{compactCurrency(route.profit)}</td>
                          <td className="px-3 py-3">{route.loadFactor}%</td>
                          <td className="px-3 py-3"><StatusPill status={route.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md bg-slate-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-800">Previous</button>
                    <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md bg-slate-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-800">Next</button>
                  </div>
                </div>
              </section>

              {selectedRouteData && <RouteDetails route={selectedRouteData} />}
            </>
          ) : tab === 'scheme' ? (
            <GovtSchemePage />
          ) : (
            <ReportsPage rows={filtered} />
          )}
        </div>
      </main>
    </div>
  );
}

function GovtSchemePage() {
  const [schemeFilters, setSchemeFilters] = useState<SchemeFilters>(initialSchemeFilters);

  const filtered = useMemo(() => applySchemeFilters(govtSchemeUsage, schemeFilters), [schemeFilters]);
  const totals = useMemo(() => schemeTotals(filtered), [filtered]);
  const topRoutes = useMemo(() => topSchemeRoutes(filtered), [filtered]);
  const monthlyTrend = useMemo(() => monthlySchemeTrend(filtered), [filtered]);
  const depotUsage = useMemo(() => depotSchemeUsage(filtered), [filtered]);
  const odUsage = useMemo(() => odSchemeUsage(filtered), [filtered]);
  const tableRows = useMemo(() => schemeTableRows(filtered), [filtered]);
  const origins = useMemo(() => ['All', ...Array.from(new Set(govtSchemeUsage.map((row) => row.origin))).sort()], []);
  const destinations = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          govtSchemeUsage
            .filter((row) => schemeFilters.origin === 'All' || row.origin === schemeFilters.origin)
            .map((row) => row.destination),
        ),
      ).sort(),
    ],
    [schemeFilters.origin],
  );
  const routesList = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          govtSchemeUsage
            .filter((row) => schemeFilters.origin === 'All' || row.origin === schemeFilters.origin)
            .filter((row) => schemeFilters.destination === 'All' || row.destination === schemeFilters.destination)
            .map((row) => row.route),
        ),
      ).sort(),
    ],
    [schemeFilters.destination, schemeFilters.origin],
  );

  const updateSchemeFilter = <K extends keyof SchemeFilters>(key: K, value: SchemeFilters[K]) => {
    setSchemeFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'origin' ? { destination: 'All', route: 'All' } : {}),
      ...(key === 'destination' ? { route: 'All' } : {}),
    }));
  };

  return (
    <>
      <section className="mb-5 rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-civic-teal text-white">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Govt Scheme</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Free Travel Scheme for Women usage and reimbursement analytics</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select value={schemeFilters.origin} onChange={(event) => updateSchemeFilter('origin', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {origins.map((origin) => <option key={origin}>{origin}</option>)}
          </select>
          <select value={schemeFilters.destination} onChange={(event) => updateSchemeFilter('destination', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {destinations.map((destination) => <option key={destination}>{destination}</option>)}
          </select>
          <select value={schemeFilters.route} onChange={(event) => updateSchemeFilter('route', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {routesList.map((route) => <option key={route}>{route}</option>)}
          </select>
          <select value={schemeFilters.month} onChange={(event) => updateSchemeFilter('month', event.target.value)} className="rounded-md border border-civic-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => <option key={month}>{month}</option>)}
          </select>
          <button onClick={() => setSchemeFilters(initialSchemeFilters)} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold dark:bg-slate-800">
            <RefreshCcw size={16} /> Reset
          </button>
        </div>
      </section>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Free Tickets Issued" value={number(totals.freeTicketsIssued)} />
        <MetricCard label="Women Beneficiaries" value={number(totals.womenBeneficiaries)} />
        <MetricCard label="Estimated Reimbursement" value={compactCurrency(totals.reimbursementAmount)} />
        <MetricCard label="Avg Daily Free Tickets" value={number(totals.averageDailyFreeTickets)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Top Routes by Free Ticket Usage">
          <ResponsiveContainer>
            <BarChart data={topRoutes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route" />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} />
              <Tooltip formatter={tooltipNumber} />
              <Bar dataKey="freeTicketsIssued" fill="#1f5d7a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Monthly Usage Trend">
          <ResponsiveContainer>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} />
              <Tooltip formatter={tooltipNumber} />
              <Line type="monotone" dataKey="freeTicketsIssued" stroke="#0f766e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Depot-wise Usage">
          <ResponsiveContainer>
            <BarChart data={depotUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depot" interval={0} angle={-18} height={60} />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} />
              <Tooltip formatter={tooltipNumber} />
              <Bar dataKey="freeTicketsIssued" fill="#c47714" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Origin-Destination Analysis">
          <ResponsiveContainer>
            <BarChart data={odUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => number(Number(value))} />
              <YAxis dataKey="od" type="category" width={138} tick={{ fontSize: 11 }} />
              <Tooltip formatter={tooltipNumber} />
              <Bar dataKey="freeTicketsIssued" fill="#16794c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <SchemeUsageTable rows={tableRows} />
    </>
  );
}

function SchemeUsageTable({ rows }: { rows: SchemeUsageRecord[] }) {
  return (
    <section className="mt-5 rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-bold">Origin-Destination Free Ticket Usage</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-3 py-3">Origin</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Route</th>
              <th className="px-3 py-3">Free Tickets Issued</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.origin}-${row.destination}-${row.route}`} className="border-b border-civic-line/70 hover:bg-civic-mist dark:border-slate-800 dark:hover:bg-slate-800/70">
                <td className="px-3 py-3 font-semibold">{row.origin}</td>
                <td className="px-3 py-3">{row.destination}</td>
                <td className="px-3 py-3 font-bold text-civic-blue dark:text-cyan-300">{row.route}</td>
                <td className="px-3 py-3">{number(row.freeTicketsIssued)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RouteList({ title, rows }: { title: string; rows: RouteAggregate[] }) {
  return (
    <section className="rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</h2>
      <div className="space-y-2">
        {rows.map((route) => (
          <div key={route.routeNumber} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <span className="font-bold text-civic-blue dark:text-cyan-300">{route.routeNumber}</span>
            <span className="truncate text-sm">{route.routeName}</span>
            <span className={`text-sm font-semibold ${route.profit >= 0 ? 'text-civic-green' : 'text-civic-red'}`}>{compactCurrency(route.profit)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RouteDetails({ route }: { route: (typeof routes)[number] }) {
  const trendData = routeTrend(route);
  const totalRevenue = trendData.reduce((sum, row) => sum + row.revenue, 0);
  const totalPassengers = trendData.reduce((sum, row) => sum + row.passengers, 0);
  const averageLoad = Math.round(trendData.reduce((sum, row) => sum + row.loadFactor, 0) / trendData.length);

  return (
    <section className="mt-5 rounded-lg border border-civic-line/80 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Route Details: {route.routeNumber}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{route.routeName} | {route.depot} Depot | {route.distanceKm} km | {route.tripsPerDay} trips/day</p>
        </div>
        <div className="text-sm font-semibold text-civic-blue dark:text-cyan-300">Fleet allocation: {route.fleet} buses</div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Route Revenue" value={compactCurrency(totalRevenue)} />
        <MetricCard label="Passengers" value={number(totalPassengers)} />
        <MetricCard label="Avg Load Factor" value={`${averageLoad}%`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartPanel title="Revenue Trend">
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={compactCurrency} width={62} />
              <Tooltip formatter={tooltipCurrency} />
              <Line type="monotone" dataKey="revenue" stroke="#1f5d7a" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Passenger Trend">
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => number(Number(value))} width={62} />
              <Tooltip formatter={tooltipNumber} />
              <Line type="monotone" dataKey="passengers" stroke="#0f766e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Load Factor Trend">
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis unit="%" width={45} domain={[30, 100]} />
              <Tooltip formatter={(value: unknown) => `${Number(value ?? 0)}%`} />
              <Line type="monotone" dataKey="loadFactor" stroke="#c47714" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </section>
  );
}

function ReportsPage({ rows }: { rows: RouteAggregate[] }) {
  return (
    <section className="rounded-lg border border-civic-line/80 bg-white p-5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-civic-teal text-white">
          <BarChart3 size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate management reports for the current filter selection.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => exportPdf(rows)} className="flex items-center justify-between rounded-lg border border-civic-line p-5 text-left hover:bg-civic-mist dark:border-slate-700 dark:hover:bg-slate-800">
          <span>
            <span className="block font-bold">Download PDF report</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Executive summary with revenue, profit, and leading routes.</span>
          </span>
          <FileText className="text-civic-red" />
        </button>
        <button onClick={() => exportExcel(rows)} className="flex items-center justify-between rounded-lg border border-civic-line p-5 text-left hover:bg-civic-mist dark:border-slate-700 dark:hover:bg-slate-800">
          <span>
            <span className="block font-bold">Download Excel report</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Route-level data workbook for offline analysis.</span>
          </span>
          <FileSpreadsheet className="text-civic-green" />
        </button>
      </div>
    </section>
  );
}

export default App;
