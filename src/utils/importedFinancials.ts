import type { ImportedRoute, RouteFinancialResult } from '../types';

/**
 * Compute daily and monthly financial results from RouteFinances.
 *
 * Revenue        = dailyPassengers × averageFare × 30
 * totalCost      = (dailyFuelCost × 30) + driverSalary + conductorSalary + maintenanceCost + otherExpenses
 * profit         = revenue - totalCost
 * passengers     = dailyPassengers × 30
 */
export function computeFinancials(finances: {
  dailyPassengers: number;
  averageFare: number;
  dailyFuelCost: number;
  driverSalary: number;
  conductorSalary: number;
  maintenanceCost: number;
  otherExpenses: number;
}): RouteFinancialResult {
  const revenue = finances.dailyPassengers * finances.averageFare * 30;
  const monthlyFuel = finances.dailyFuelCost * 30;
  const totalCost =
    monthlyFuel +
    finances.driverSalary +
    finances.conductorSalary +
    finances.maintenanceCost +
    finances.otherExpenses;
  const profit = revenue - totalCost;
  const passengers = finances.dailyPassengers * 30;

  return { revenue, totalCost, profit, passengers };
}

/** Aggregate totals across all imported routes */
export function aggregateImportedFinancials(
  routes: ImportedRoute[],
): { revenue: number; totalCost: number; profit: number; passengers: number; routeCount: number } {
  let revenue = 0;
  let totalCost = 0;
  let profit = 0;
  let passengers = 0;

  for (const route of routes) {
    const result = computeFinancials(route.finances);
    revenue += result.revenue;
    totalCost += result.totalCost;
    profit += result.profit;
    passengers += result.passengers;
  }

  return {
    revenue,
    totalCost,
    profit,
    passengers,
    routeCount: routes.length,
  };
}

/** Compute financials for every imported route and sort by profit descending */
export function computeAllFinancials(
  routes: ImportedRoute[],
): (ImportedRoute & RouteFinancialResult)[] {
  return routes
    .map((r) => ({ ...r, ...computeFinancials(r.finances) }))
    .sort((a, b) => b.profit - a.profit);
}