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

/** Financial input fields imported from Excel for each route */
export interface RouteFinances {
  dailyPassengers: number;
  averageFare: number;
  dailyFuelCost: number;
  driverSalary: number;
  conductorSalary: number;
  maintenanceCost: number;
  otherExpenses: number;
}

/** Schema for imported Excel route data — includes route info + financial input fields */
export interface ImportedRoute {
  busNumber: string;
  routeName: string;
  source: string;
  destination: string;
  stops: string[];
  distance: string;
  estimatedDuration: string;
  finances: RouteFinances;
}

/** Computed financial results derived from RouteFinances */
export interface RouteFinancialResult {
  revenue: number;
  totalCost: number;
  profit: number;
  passengers: number;
}

/** Result of parsing an Excel file */
export interface ImportResult {
  routes: ImportedRoute[];
  skipped: number;
  errors: string[];
}

/** Metadata tracked for each import operation */
export interface ImportMetadata {
  fileName: string;
  timestamp: number;
  totalRoutes: number;
}

/** Full state stored in localStorage */
export interface ImportState {
  routes: ImportedRoute[];
  metadata: ImportMetadata | null;
}