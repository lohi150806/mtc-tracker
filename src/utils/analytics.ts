import { Filters, RouteAggregate, RoutePerformance, Status } from '../types';
import { monthOrder } from '../data/routes';

export const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const compactCurrency = (value: number) => {
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return currency(value);
};

export const number = (value: number) => new Intl.NumberFormat('en-IN').format(value);

export const statusFor = (profit: number, loadFactor: number): Status => {
  if (profit < 0) return 'Loss Making';
  if (loadFactor < 60 || profit < 1000000) return 'Watchlist';
  return 'Profitable';
};

export const aggregateRoute = (route: RoutePerformance, selectedMonth = 'All'): RouteAggregate => {
  const monthly = selectedMonth === 'All' ? route.monthly : route.monthly.filter((entry) => entry.month === selectedMonth);
  const revenue = monthly.reduce((sum, entry) => sum + entry.revenue, 0);
  const cost = monthly.reduce((sum, entry) => sum + entry.cost, 0);
  const passengers = monthly.reduce((sum, entry) => sum + entry.passengers, 0);
  const loadFactor = Math.round(monthly.reduce((sum, entry) => sum + entry.loadFactor, 0) / monthly.length);
  const profit = revenue - cost;

  return { ...route, revenue, cost, passengers, loadFactor, profit, status: statusFor(profit, loadFactor) };
};

export const applyFilters = (routes: RoutePerformance[], filters: Filters) =>
  routes
    .filter((route) => route.busType === filters.busType)
    .filter((route) => filters.depot === 'All' || route.depot === filters.depot)
    .filter((route) => filters.route === 'All' || route.routeNumber === filters.route)
    .map((route) => aggregateRoute(route, filters.month))
    .filter((route) => {
      const term = filters.search.trim().toLowerCase();
      if (!term) return true;
      return `${route.routeNumber} ${route.routeName} ${route.depot}`.toLowerCase().includes(term);
    });

export const totalsFor = (routes: RouteAggregate[]) => {
  const revenue = routes.reduce((sum, route) => sum + route.revenue, 0);
  const cost = routes.reduce((sum, route) => sum + route.cost, 0);
  const passengers = routes.reduce((sum, route) => sum + route.passengers, 0);
  const loadFactor = routes.length
    ? Math.round(routes.reduce((sum, route) => sum + route.loadFactor, 0) / routes.length)
    : 0;

  return {
    revenue,
    cost,
    profit: revenue - cost,
    loadFactor,
    routes: routes.length,
    passengers,
  };
};

export const monthlyTrend = (routes: RoutePerformance[], busType = 'Normal', depot = 'All', routeNumber = 'All') => {
  const scoped = routes.filter(
    (route) => route.busType === busType && (depot === 'All' || route.depot === depot) && (routeNumber === 'All' || route.routeNumber === routeNumber),
  );

  // Collect all unique months present in the data, sorted by monthOrder
  const presentMonths = monthOrder.filter((m) => scoped.some((route) => route.monthly.find((metric) => metric.month === m)));
  const monthsToUse = presentMonths.length > 0 ? presentMonths : monthOrder;

  return monthsToUse.map((month) => {
    return scoped.reduce(
      (row, route) => {
        const entry = route.monthly.find((metric) => metric.month === month);
        if (!entry) return row; // skip routes that don't have this month
        row.revenue += entry.revenue;
        row.cost += entry.cost;
        row.profit += entry.revenue - entry.cost;
        row.passengers += entry.passengers;
        row.loadFactor += entry.loadFactor;
        return row;
      },
      { month, revenue: 0, cost: 0, profit: 0, passengers: 0, loadFactor: 0 },
    );
  }).map((row) => ({
    ...row,
    loadFactor: scoped.length ? Math.round(row.loadFactor / scoped.length) : 0,
  }));
};

export const depotRevenue = (routes: RouteAggregate[]) => {
  const rows = new Map<string, number>();
  routes.forEach((route) => rows.set(route.depot, (rows.get(route.depot) ?? 0) + route.revenue));
  return Array.from(rows, ([depot, revenue]) => ({ depot, revenue })).sort((a, b) => b.revenue - a.revenue);
};

export const loadDistribution = (routes: RouteAggregate[]) => [
  { name: 'High 75%+', value: routes.filter((route) => route.loadFactor >= 75).length, fill: '#16794c' },
  { name: 'Optimal 60-74%', value: routes.filter((route) => route.loadFactor >= 60 && route.loadFactor < 75).length, fill: '#1f5d7a' },
  { name: 'Low <60%', value: routes.filter((route) => route.loadFactor < 60).length, fill: '#b42318' },
];

export const routeTrend = (route: RoutePerformance) =>
  route.monthly.map((entry) => ({ ...entry, profit: entry.revenue - entry.cost }));
