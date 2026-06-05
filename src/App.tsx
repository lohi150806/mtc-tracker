import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { ArrowUpRight, BarChart3, Bus, Download, FileSpreadsheet, FileText, Landmark, LockKeyhole, Moon, RefreshCcw, Search, ShieldCheck, Sun, TrendingUp, User } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import Sidebar from './components/Sidebar';
import KPI from './components/KPI';
import AIInsights from './components/AIInsights';
import NotificationPanel from './components/NotificationPanel';
import ProfileMenu from './components/ProfileMenu';
import TopNav from './components/TopNav';
import MapPage from './pages/MapPage';
import ExecutiveView from './pages/Executive';
import SettingsPage from './pages/Settings';
import WelcomeBanner from './components/WelcomeBanner';

const initialFilters: Filters = { depot: 'All', route: 'All', month: 'All', busType: 'Normal', search: '' };
const initialSchemeFilters: SchemeFilters = { origin: 'All', destination: 'All', route: 'All', month: 'All' };
const busTypes: BusType[] = ['Normal', 'AC'];
const pageSize = 8;
const tooltipCurrency = (value: unknown) => currency(Number(value ?? 0));
const tooltipNumber = (value: unknown) => number(Number(value ?? 0));

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">{title}</h2>
      <div className="h-72">{children}</div>
    </section>
  );
}

function DepotRevenueTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as { fullDepot: string; revenue: number };
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-3 text-sm text-[#E2E8F0] shadow-lg">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">Depot</div>
      <div className="mt-1 font-semibold text-[#E2E8F0]">{entry.fullDepot}</div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">Revenue</div>
      <div className="mt-1 font-semibold text-[#34D399]">{compactCurrency(entry.revenue)}</div>
    </div>
  );
}

function SchemeStatCard({ icon, label, value, trend, trendTone }: { icon: ReactNode; label: string; value: string; trend: string; trendTone?: string }) {
  return (
    <div className="group h-full rounded-3xl border border-[#0F172A] bg-[#0B1220] p-5 shadow-panel transition duration-200 hover:-translate-y-0.5 hover:border-[#0EA5E9] hover:bg-[#11203b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]">{label}</div>
          <div className="mt-4 text-3xl font-bold text-[#E2E8F0]">{value}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0F172A] text-[#0EA5E9]">{icon}</div>
      </div>
      <div className={`mt-4 inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3 py-1 text-xs font-semibold ${trendTone ?? 'text-[#22C55E]'}`}>
        <ArrowUpRight className="h-3.5 w-3.5" />
        {trend}
      </div>
    </div>
  );
}

function SchemeTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B1220] p-3 text-sm text-[#E2E8F0] shadow-xl">
      {payload.map((entry, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#94A3B8]">{entry.name}</div>
          <div className="mt-1 font-semibold text-[#E2E8F0]">{entry.value}</div>
          {entry.payload?.fullDepot && <div className="text-xs text-[#94A3B8]">{entry.payload.fullDepot}</div>}
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 shadow-panel">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${tone ?? 'text-cyan-200'}`}>{value}</div>
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

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-700 dark:text-slate-100">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-700 dark:text-slate-100">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function LoginPage({ dark, onToggleDark, onLogin }: { dark: boolean; onToggleDark: () => void; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/dashboard';

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onLogin(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setError('Authentication failed. Please verify your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <main className="grid min-h-screen place-items-center bg-[#0B1220] px-4 py-8 text-slate-100">
        <button
          aria-label="Toggle theme"
          onClick={onToggleDark}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md bg-[#0F172A] text-[#E2E8F0] shadow-panel"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <section className="w-full max-w-md rounded-[2rem] border border-[#1E293B] bg-[#0F172A] p-7 shadow-panel sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#0EA5E9] text-[#0B1220]">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-[#E2E8F0]">MTC Dashboard Login</h1>
            <p className="mt-2 text-sm text-[#94A3B8]">Authorized access for transport performance analytics</p>
          </div>

          <form onSubmit={submitLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">Email</span>
              <span className="relative block">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#0B1220] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
                  placeholder="Enter email"
                  autoComplete="email"
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
                  className="w-full rounded-xl border border-[#1E293B] bg-[#0B1220] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20"
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

            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-civic-blue px-4 py-3 text-sm font-bold text-white transition hover:bg-civic-blue/90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function DashboardShell({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const { logout } = useAuth();
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
  const [activeDepotIndex, setActiveDepotIndex] = useState<number | null>(null);
  const depotCodes: Record<string, string> = {
    Tambaram: 'TBM',
    Vadapalani: 'VDP',
    Thiruvanmiyur: 'TVM',
    'Anna Nagar': 'ANN',
    Chromepet: 'CMP',
    Washermanpet: 'WPM',
    Adyar: 'ADY',
    'T Nagar': 'TNG',
  };
  const depotData = useMemo(
    () => depotRevenue(filtered).map((row) => ({ ...row, depotCode: depotCodes[row.depot] ?? row.depot, fullDepot: row.depot })),
    [filtered],
  );
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

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-[#0B1220] text-[#E2E8F0]">
        <TopNav onLogout={logout} />

        {/* Welcome banner */}
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <WelcomeBanner />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          {tab !== 'scheme' && (
            <section className="mb-5 grid gap-3 rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel lg:grid-cols-[1fr_1fr_1fr_auto]">
              <select value={filters.depot} onChange={(event) => updateFilter('depot', event.target.value)} className="rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
                {depots.map((depot) => <option key={depot} className="bg-[#0F172A] text-[#E2E8F0]">{depot}</option>)}
              </select>
              <select value={filters.route} onChange={(event) => updateFilter('route', event.target.value)} className="rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
                {routeOptions.map((route) => <option key={route} className="bg-[#0F172A] text-[#E2E8F0]">{route}</option>)}
              </select>
              <select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)} className="rounded-md border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
                {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => <option key={month} className="bg-[#0F172A] text-[#E2E8F0]">{month}</option>)}
              </select>
              <button onClick={() => { setFilters((current) => ({ ...initialFilters, busType: current.busType })); setPage(1); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-semibold text-[#E2E8F0] hover:bg-[#11203b]">
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
                    <BarChart data={depotData} margin={{ top: 18, right: 18, left: 0, bottom: 28 }} barCategoryGap="25%" barGap={12}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="depotCode"
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                        height={50}
                        tick={{ fill: '#94A3B8', fontSize: 11, dy: 12 }}
                      />
                      <YAxis tickFormatter={compactCurrency} width={70} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <Tooltip content={<DepotRevenueTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                      <Bar
                        dataKey="revenue"
                        fill="#34D399"
                        radius={[6, 6, 0, 0]}
                        animationDuration={450}
                        onMouseLeave={() => setActiveDepotIndex(null)}
                        onMouseEnter={(_, index) => setActiveDepotIndex(index)}
                      >
                        {depotData.map((entry, index) => (
                          <Cell
                            key={entry.depot}
                            fill="#34D399"
                            style={{
                              transition: 'transform 180ms ease, filter 180ms ease',
                              transformOrigin: 'center bottom',
                              transform: activeDepotIndex === index ? 'scaleY(1.04)' : 'scaleY(1)',
                              filter: activeDepotIndex === index ? 'drop-shadow(0 4px 12px rgba(52, 211, 153, 0.35))' : 'none',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Bar>
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

              <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold text-[#E2E8F0]">Route Performance Table</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative">
                      <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={16} />
                      <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search route" className="w-full rounded-md border border-[#1E293B] bg-[#0F172A] py-2 pl-9 pr-3 text-sm text-[#E2E8F0] sm:w-56" />
                    </label>
                    <button onClick={() => exportCsv(sorted)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0EA5E9] px-3 py-2 text-sm font-semibold text-[#0B1220] hover:bg-[#0891b2]">
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-sm">
                    <thead className="bg-[#0F172A] text-left text-xs uppercase tracking-wide text-[#94A3B8]">
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
                    <button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md bg-[#0F172A] px-3 py-2 text-[#E2E8F0] disabled:opacity-40 hover:bg-[#11203b]">Previous</button>
                    <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md bg-[#0F172A] px-3 py-2 text-[#E2E8F0] disabled:opacity-40 hover:bg-[#11203b]">Next</button>
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
    </div>
  );
}

function GovtSchemePage() {
  const [schemeFilters, setSchemeFilters] = useState<SchemeFilters>(initialSchemeFilters);
  const [activeTopRoute, setActiveTopRoute] = useState<number | null>(null);
  const [activeDepot, setActiveDepot] = useState<number | null>(null);

  const depotCodes: Record<string, string> = {
    Tambaram: 'TBM',
    Vadapalani: 'VDP',
    Thiruvanmiyur: 'TVM',
    'Anna Nagar': 'ANN',
    Chromepet: 'CMP',
    Washermanpet: 'WPM',
    Adyar: 'ADY',
    'T Nagar': 'TNG',
  };

  const filtered = useMemo(() => applySchemeFilters(govtSchemeUsage, schemeFilters), [schemeFilters]);
  const totals = useMemo(() => schemeTotals(filtered), [filtered]);
  const topRoutes = useMemo(() => topSchemeRoutes(filtered), [filtered]);
  const monthlyTrend = useMemo(() => monthlySchemeTrend(filtered), [filtered]);
  const depotUsage = useMemo(
    () => depotSchemeUsage(filtered).map((row) => ({ ...row, depotCode: depotCodes[row.depot] ?? row.depot, fullDepot: row.depot })),
    [filtered],
  );
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

  const lastUpdated = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
    [],
  );

  const latestMonth = monthlyTrend[monthlyTrend.length - 1] ?? { month: '', freeTicketsIssued: 0, reimbursementAmount: 0 };
  const previousMonth = monthlyTrend[monthlyTrend.length - 2] ?? { month: '', freeTicketsIssued: 0, reimbursementAmount: 0 };
  const previousMonthTickets = previousMonth.freeTicketsIssued || 1;
  const previousMonthReimbursement = previousMonth.reimbursementAmount || 1;
  const ticketGrowthPct = Math.round(((latestMonth.freeTicketsIssued - previousMonthTickets) / previousMonthTickets) * 100);
  const reimbursementGrowthPct = Math.round(((latestMonth.reimbursementAmount - previousMonthReimbursement) / previousMonthReimbursement) * 100);
  const beneficiaryTrend = ticketGrowthPct >= 0 ? `${ticketGrowthPct}% MoM` : `${ticketGrowthPct}%`; 
  const averageDailyTrend = reimbursementGrowthPct >= 0 ? `${reimbursementGrowthPct}% MoM` : `${reimbursementGrowthPct}%`;

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
      <section className="mb-5 rounded-3xl border border-[#1E293B] bg-[#0B1220] p-5 shadow-panel">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
              Scheme Analytics
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#E2E8F0]">Kalaignar Magalir Free Bus Travel Scheme</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
              Women Ridership & Government Reimbursement Analytics
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#94A3B8]">
              Last updated: {lastUpdated}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-[#0B1220] transition hover:bg-[#0c9ddc]">
                <FileText size={16} /> Export PDF
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-[#0EA5E9] bg-transparent px-4 py-2 text-sm font-semibold text-[#0EA5E9] transition hover:bg-[#0EA5E9]/10">
                <Download size={16} /> Download Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select value={schemeFilters.origin} onChange={(event) => updateSchemeFilter('origin', event.target.value)} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
            {origins.map((origin) => <option key={origin} className="bg-[#0F172A] text-[#E2E8F0]">{origin}</option>)}
          </select>
          <select value={schemeFilters.destination} onChange={(event) => updateSchemeFilter('destination', event.target.value)} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
            {destinations.map((destination) => <option key={destination} className="bg-[#0F172A] text-[#E2E8F0]">{destination}</option>)}
          </select>
          <select value={schemeFilters.route} onChange={(event) => updateSchemeFilter('route', event.target.value)} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
            {routesList.map((route) => <option key={route} className="bg-[#0F172A] text-[#E2E8F0]">{route}</option>)}
          </select>
          <select value={schemeFilters.month} onChange={(event) => updateSchemeFilter('month', event.target.value)} className="rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20">
            {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => <option key={month} className="bg-[#0F172A] text-[#E2E8F0]">{month}</option>)}
          </select>
          <button onClick={() => setSchemeFilters(initialSchemeFilters)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1E293B] bg-[#0F172A] px-4 py-3 text-sm font-semibold text-[#E2E8F0] transition hover:border-[#0EA5E9] hover:bg-[#11203b]">
            <RefreshCcw size={16} /> Reset Filters
          </button>
        </div>
      </section>

      <section className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <SchemeStatCard icon={<Bus size={20} />} label="Total Free Tickets Issued" value={number(totals.freeTicketsIssued)} trend={`${ticketGrowthPct}% MoM`} />
        <SchemeStatCard icon={<ShieldCheck size={20} />} label="Women Beneficiaries" value={number(totals.womenBeneficiaries)} trend={beneficiaryTrend} />
        <SchemeStatCard icon={<FileText size={20} />} label="Estimated Reimbursement" value={compactCurrency(totals.reimbursementAmount)} trend={`${reimbursementGrowthPct}% MoM`} />
        <SchemeStatCard icon={<BarChart3 size={20} />} label="Avg Daily Free Tickets" value={number(totals.averageDailyFreeTickets)} trend={averageDailyTrend} />
        <SchemeStatCard icon={<Download size={20} />} label="Pending Reimbursement" value={compactCurrency(totals.reimbursementAmount)} trend="Awaiting approval" trendTone="text-[#F59E0B]" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Top Routes by Free Ticket Usage">
          <div className="mb-3 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>High-volume corridors in the free travel scheme</span>
            <span className="rounded-full bg-[#0F172A] px-2 py-1 text-[#0EA5E9]">Top route: {topRoutes[0]?.route ?? 'N/A'}</span>
          </div>
          <ResponsiveContainer>
            <BarChart data={topRoutes} margin={{ top: 12, right: 16, left: 0, bottom: 20 }} barCategoryGap="22%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="route" tick={{ fill: '#94A3B8', fontSize: 11, dy: 8 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip content={<SchemeTooltip />} />
              <Bar dataKey="freeTicketsIssued" fill="#0EA5E9" radius={[10, 10, 0, 0]}>
                {topRoutes.map((entry, index) => (
                  <Cell
                    key={entry.route}
                    fill="#0EA5E9"
                    style={{
                      transition: 'transform 180ms ease, filter 180ms ease',
                      transformOrigin: 'center bottom',
                      transform: activeTopRoute === index ? 'scaleY(1.04)' : 'scaleY(1)',
                      filter: activeTopRoute === index ? 'drop-shadow(0 8px 20px rgba(14,165,233,0.28))' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setActiveTopRoute(index)}
                    onMouseLeave={() => setActiveTopRoute(null)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Monthly Usage Trend">
          <div className="mb-3 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Free ticket issuance progression with monthly momentum</span>
            <span className="rounded-full bg-[#0F172A] px-2 py-1 font-semibold text-[#22C55E]">{ticketGrowthPct >= 0 ? '▲' : '▼'} {Math.abs(ticketGrowthPct)}% MoM</span>
          </div>
          <ResponsiveContainer>
            <AreaChart data={monthlyTrend} margin={{ top: 16, right: 24, left: 0, bottom: 12 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip content={<SchemeTooltip />} />
              <Area type="monotone" dataKey="freeTicketsIssued" stroke="#0EA5E9" strokeWidth={4} fill="url(#usageGradient)" activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Depot-wise Usage">
          <div className="mb-3 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Depot load by free ticket issuance</span>
            <span className="rounded-full bg-[#0F172A] px-2 py-1 text-[#0EA5E9]">Short codes shown for clarity</span>
          </div>
          <ResponsiveContainer>
            <BarChart data={depotUsage} margin={{ top: 16, right: 18, left: 0, bottom: 24 }} barCategoryGap="18%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="depotCode" tick={{ fill: '#94A3B8', fontSize: 11, dy: 8 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value) => number(Number(value))} width={70} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip content={<SchemeTooltip />} />
              <Bar
                dataKey="freeTicketsIssued"
                fill="#0EA5E9"
                radius={[10, 10, 0, 0]}
                onMouseLeave={() => setActiveDepot(null)}
              >
                {depotUsage.map((entry, index) => (
                  <Cell
                    key={entry.depot}
                    fill="#0EA5E9"
                    style={{
                      transition: 'transform 180ms ease, filter 180ms ease',
                      transformOrigin: 'center bottom',
                      transform: activeDepot === index ? 'scaleY(1.04)' : 'scaleY(1)',
                      filter: activeDepot === index ? 'drop-shadow(0 8px 20px rgba(14,165,233,0.28))' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setActiveDepot(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Origin-Destination Analysis">
          <div className="mb-3 flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Top origin-destination corridors by ridership</span>
            <span className="rounded-full bg-[#0F172A] px-2 py-1 text-[#0EA5E9]">Top 10 ranked</span>
          </div>
          <ResponsiveContainer>
            <BarChart data={odUsage} layout="vertical" margin={{ top: 15, right: 24, left: 0, bottom: 12 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis type="number" tickFormatter={(value) => number(Number(value))} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis dataKey="od" type="category" width={190} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<SchemeTooltip />} />
              <Bar dataKey="freeTicketsIssued" fill="#0EA5E9" radius={[0, 10, 10, 0]}>
                <LabelList dataKey="freeTicketsIssued" position="right" fill="#0EA5E9" style={{ fontSize: 11, fontWeight: 700 }} formatter={(value) => number(Number(value))} />
              </Bar>
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
    <section className="mt-5 rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
      <h2 className="mb-4 text-base font-bold text-[#E2E8F0]">Origin-Destination Free Ticket Usage</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead className="bg-[#0F172A] text-left text-xs uppercase tracking-wide text-[#94A3B8]">
            <tr>
              <th className="px-3 py-3">Origin</th>
              <th className="px-3 py-3">Destination</th>
              <th className="px-3 py-3">Route</th>
              <th className="px-3 py-3">Free Tickets Issued</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.origin}-${row.destination}-${row.route}`} className="border-b border-[#1E293B] hover:bg-[#11203b]">
                <td className="px-3 py-3 font-semibold text-[#E2E8F0]">{row.origin}</td>
                <td className="px-3 py-3 text-[#94A3B8]">{row.destination}</td>
                <td className="px-3 py-3 font-bold text-[#0EA5E9]">{row.route}</td>
                <td className="px-3 py-3 text-[#E2E8F0]">{number(row.freeTicketsIssued)}</td>
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
    <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">{title}</h2>
      <div className="space-y-2">
        {rows.map((route) => (
          <div key={route.routeNumber} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-md bg-[#0F172A] px-3 py-2">
            <span className="font-bold text-[#0EA5E9]">{route.routeNumber}</span>
            <span className="truncate text-sm text-[#E2E8F0]">{route.routeName}</span>
            <span className={`text-sm font-semibold ${route.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{compactCurrency(route.profit)}</span>
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
    <section className="mt-5 rounded-lg border border-[#1E293B] bg-[#0B1220] p-4 shadow-panel">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#E2E8F0]">Route Details: {route.routeNumber}</h2>
          <p className="text-sm text-[#94A3B8]">{route.routeName} | {route.depot} Depot | {route.distanceKm} km | {route.tripsPerDay} trips/day</p>
        </div>
        <div className="text-sm font-semibold text-[#0EA5E9]">Fleet allocation: {route.fleet} buses</div>
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
    <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-5 shadow-panel">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
          <BarChart3 size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#E2E8F0]">Reports</h2>
          <p className="text-sm text-[#94A3B8]">Generate management reports for the current filter selection.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => exportPdf(rows)} className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#0F172A] p-5 text-left hover:bg-[#11203b]">
          <span>
            <span className="block font-bold text-[#E2E8F0]">Download PDF report</span>
            <span className="text-sm text-[#94A3B8]">Executive summary with revenue, profit, and leading routes.</span>
          </span>
          <FileText className="text-[#f87171]" />
        </button>
        <button onClick={() => exportExcel(rows)} className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#0F172A] p-5 text-left hover:bg-[#11203b]">
          <span>
            <span className="block font-bold text-[#E2E8F0]">Download Excel report</span>
            <span className="text-sm text-[#94A3B8]">Route-level data workbook for offline analysis.</span>
          </span>
          <FileSpreadsheet className="text-[#34d399]" />
        </button>
      </div>
    </section>
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const { login } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage dark={dark} onToggleDark={() => setDark((value) => !value)} onLogin={login} />
            </AuthRedirect>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell dark={dark} onToggleDark={() => setDark((value) => !value)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheme"
          element={
            <ProtectedRoute>
              <GovtSchemePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executive"
          element={
            <ProtectedRoute>
              <ExecutiveView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
