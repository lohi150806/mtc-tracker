import { SchemeFilters, SchemeUsageRecord } from '../types';
import { monthOrder } from '../data/routes';

export const applySchemeFilters = (rows: SchemeUsageRecord[], filters: SchemeFilters) =>
  rows.filter(
    (row) =>
      (filters.origin === 'All' || row.origin === filters.origin) &&
      (filters.destination === 'All' || row.destination === filters.destination) &&
      (filters.route === 'All' || row.route === filters.route) &&
      (filters.month === 'All' || row.month === filters.month),
  );

export const schemeTotals = (rows: SchemeUsageRecord[]) => {
  const freeTicketsIssued = rows.reduce((sum, row) => sum + row.freeTicketsIssued, 0);
  const womenBeneficiaries = rows.reduce((sum, row) => sum + row.womenBeneficiaries, 0);
  const reimbursementAmount = rows.reduce((sum, row) => sum + row.reimbursementAmount, 0);
  const activeDays = rows.length ? 365 : 0;

  return {
    freeTicketsIssued,
    womenBeneficiaries,
    reimbursementAmount,
    averageDailyFreeTickets: activeDays ? Math.round(freeTicketsIssued / activeDays) : 0,
  };
};

export const topSchemeRoutes = (rows: SchemeUsageRecord[]) => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => grouped.set(row.route, (grouped.get(row.route) ?? 0) + row.freeTicketsIssued));
  return Array.from(grouped, ([route, freeTicketsIssued]) => ({ route, freeTicketsIssued }))
    .sort((a, b) => b.freeTicketsIssued - a.freeTicketsIssued)
    .slice(0, 10);
};

export const monthlySchemeTrend = (rows: SchemeUsageRecord[]) =>
  monthOrder.map((month) => ({
    month,
    freeTicketsIssued: rows.filter((row) => row.month === month).reduce((sum, row) => sum + row.freeTicketsIssued, 0),
    reimbursementAmount: rows.filter((row) => row.month === month).reduce((sum, row) => sum + row.reimbursementAmount, 0),
  }));

export const depotSchemeUsage = (rows: SchemeUsageRecord[]) => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => grouped.set(row.depot, (grouped.get(row.depot) ?? 0) + row.freeTicketsIssued));
  return Array.from(grouped, ([depot, freeTicketsIssued]) => ({ depot, freeTicketsIssued })).sort((a, b) => b.freeTicketsIssued - a.freeTicketsIssued);
};

export const odSchemeUsage = (rows: SchemeUsageRecord[]) => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    const od = `${row.origin} to ${row.destination}`;
    grouped.set(od, (grouped.get(od) ?? 0) + row.freeTicketsIssued);
  });
  return Array.from(grouped, ([od, freeTicketsIssued]) => ({ od, freeTicketsIssued }))
    .sort((a, b) => b.freeTicketsIssued - a.freeTicketsIssued)
    .slice(0, 10);
};

export const schemeTableRows = (rows: SchemeUsageRecord[]) => {
  const grouped = new Map<string, SchemeUsageRecord>();
  rows.forEach((row) => {
    const key = `${row.origin}-${row.destination}-${row.route}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...row });
      return;
    }
    existing.freeTicketsIssued += row.freeTicketsIssued;
    existing.womenBeneficiaries += row.womenBeneficiaries;
    existing.reimbursementAmount += row.reimbursementAmount;
  });
  return Array.from(grouped.values()).sort((a, b) => b.freeTicketsIssued - a.freeTicketsIssued);
};
