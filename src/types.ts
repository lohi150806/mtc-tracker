export type Depot =
  | 'Adyar'
  | 'Anna Nagar'
  | 'Chromepet'
  | 'T. Nagar'
  | 'Tambaram'
  | 'Thiruvanmiyur'
  | 'Vadapalani'
  | 'Washermanpet';

export type Month =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export type Status = 'Profitable' | 'Watchlist' | 'Loss Making';
export type BusType = 'Normal' | 'AC';

export interface MonthlyMetric {
  month: Month;
  revenue: number;
  cost: number;
  passengers: number;
  loadFactor: number;
}

export interface RoutePerformance {
  routeNumber: string;
  routeName: string;
  depot: Depot;
  busType: BusType;
  distanceKm: number;
  tripsPerDay: number;
  fleet: number;
  monthly: MonthlyMetric[];
}

export interface RouteAggregate extends RoutePerformance {
  revenue: number;
  cost: number;
  profit: number;
  passengers: number;
  loadFactor: number;
  status: Status;
}

export interface Filters {
  depot: string;
  route: string;
  month: string;
  busType: BusType;
  search: string;
}

export interface SchemeUsageRecord {
  origin: string;
  destination: string;
  route: string;
  depot: Depot;
  month: Month;
  freeTicketsIssued: number;
  womenBeneficiaries: number;
  reimbursementAmount: number;
}

export interface SchemeFilters {
  origin: string;
  destination: string;
  route: string;
  month: string;
}
