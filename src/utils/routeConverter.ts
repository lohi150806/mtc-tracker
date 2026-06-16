import type { ImportedRoute, RoutePerformance, MonthlyMetric, Month } from '../types';
import { computeFinancials } from './importedFinancials';

const months: Month[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Convert a single ImportedRoute (with monthly financial totals) into a
 * RoutePerformance shape that the dashboard expects (12 months of data).
 *
 * Financials are spread evenly across all 12 months so that totals match
 * the monthly aggregates the dashboard computes internally.
 */
export function convertImportedRoute(route: ImportedRoute): RoutePerformance {
  const result = computeFinancials(route.finances);

  const monthlyRevenue = Math.round(result.revenue / 12);
  const monthlyCost = Math.round(result.totalCost / 12);
  const monthlyPassengers = Math.round(result.passengers / 12);
  // Reasonable load-factor proxy: if every seat were filled it would be 100 %,
  // here we estimate based on passenger volume vs distance.
  const loadEstimate = Math.min(
    92,
    Math.max(38, Math.round(monthlyPassengers / (route.finances.dailyPassengers * 0.6))),
  );

  const monthly: MonthlyMetric[] = months.map((month) => ({
    month,
    revenue: monthlyRevenue,
    cost: monthlyCost,
    passengers: monthlyPassengers,
    loadFactor: loadEstimate,
  }));

  // Use the source city as the "depot" for filtering purposes;
  // fall back to destination if source is empty.
  const depot = route.source?.trim() || route.destination?.trim() || 'Imported';

  return {
    routeNumber: route.busNumber,
    routeName: route.routeName,
    depot: depot as RoutePerformance['depot'],
    busType: 'Normal' as const,
    distanceKm: parseInt(route.distance, 10) || 0,
    tripsPerDay: Math.max(1, Math.round(route.finances.dailyPassengers / 50)),
    fleet: 1,
    monthly,
  };
}

/**
 * Convert an array of ImportedRoute into RoutePerformance[] so the
 * standard dashboard (KPIs, charts, filters) can render them.
 */
export function convertImportedRoutes(imported: ImportedRoute[]): RoutePerformance[] {
  return imported.map(convertImportedRoute);
}