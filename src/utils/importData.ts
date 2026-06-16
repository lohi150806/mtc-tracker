import * as XLSX from 'xlsx';
import type { ImportedRoute, ImportResult, RouteFinances } from '../types';

/** Default financial values when a column is missing from the Excel */
const DEFAULT_FINANCES: RouteFinances = {
  dailyPassengers: 1500,
  averageFare: 12,
  dailyFuelCost: 8500,
  driverSalary: 22000,
  conductorSalary: 18000,
  maintenanceCost: 12000,
  otherExpenses: 8000,
};

/**
 * Column name normalisation:
 * - Lowercases
 * - Removes all spaces and underscores
 * - Returns the canonical key for lookup
 */
function normalizeKey(key: string): string {
  return key.replace(/[\s_]/g, '').toLowerCase();
}

/**
 * Flexible column mapping. The map's keys are normalised forms; the values
 * are the internal field names.
 */
const COLUMN_MAP: Record<string, string> = {
  // Route info
  busnumber: 'busNumber',
  busnumber1: 'busNumber',
  busno: 'busNumber',
  routename: 'routeName',
  routename1: 'routeName',
  route: 'routeName',
  source: 'source',
  startpoint: 'source',
  start: 'source',
  origin: 'source',
  destination: 'destination',
  endpoint: 'destination',
  end: 'destination',
  dest: 'destination',
  stops: 'stops',
  stop: 'stops',
  distance: 'distance',
  dist: 'distance',
  estimatedduration: 'estimatedDuration',
  duration: 'estimatedDuration',
  estimated: 'estimatedDuration',
  estduration: 'estimatedDuration',
  time: 'estimatedDuration',
  // Financial fields
  dailypassengers: 'dailyPassengers',
  dailypassenger: 'dailyPassengers',
  passengers: 'dailyPassengers',
  avgfare: 'averageFare',
  averagefare: 'averageFare',
  fare: 'averageFare',
  dailyfuelcost: 'dailyFuelCost',
  fuelcost: 'dailyFuelCost',
  fuel: 'dailyFuelCost',
  driversalary: 'driverSalary',
  salarydriver: 'driverSalary',
  conductorsalary: 'conductorSalary',
  salaryconductor: 'conductorSalary',
  maintenancecost: 'maintenanceCost',
  maintenance: 'maintenanceCost',
  otherexpenses: 'otherExpenses',
  otherexpense: 'otherExpenses',
  expenses: 'otherExpenses',
  other: 'otherExpenses',
};

/** Required fields that must be present and non-empty */
const REQUIRED_FIELDS = ['busNumber', 'source', 'destination'];

/** Parse a numeric value from a cell, returning 0 if unparseable */
function parseNumber(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[₹,\s]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Read an Excel ArrayBuffer, parse the first worksheet, and return
 * validated ImportedRoute objects with computed financial fields.
 */
export function parseExcel(buffer: ArrayBuffer, fileName: string): ImportResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The Excel file has no worksheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rawRows.length === 0) {
    throw new Error('The worksheet is empty. Please add route data before importing.');
  }

  // Build internal → column-name mapping by normalising headers from the first row
  const firstRow = rawRows[0];
  const headerKeys = Object.keys(firstRow);
  const fieldToColumn: Record<string, string> = {};

  for (const col of headerKeys) {
    const normalised = normalizeKey(col);
    const mapped = COLUMN_MAP[normalised];
    if (mapped && !fieldToColumn[mapped]) {
      fieldToColumn[mapped] = col;
    }
  }

  // Verify at least the required fields are mapped
  for (const field of REQUIRED_FIELDS) {
    if (!fieldToColumn[field]) {
      for (const col of headerKeys) {
        const norm = normalizeKey(col);
        if (
          (field === 'busNumber' && (norm.includes('bus') || norm === 'number')) ||
          (field === 'source' && (norm.includes('source') || norm.includes('start') || norm.includes('origin'))) ||
          (field === 'destination' && (norm.includes('dest') || norm.includes('end')))
        ) {
          if (!fieldToColumn[field]) fieldToColumn[field] = col;
        }
      }
    }
    if (!fieldToColumn[field]) {
      const columnNames = REQUIRED_FIELDS.map((f) => COLUMN_MAP[Object.keys(COLUMN_MAP).find((k) => COLUMN_MAP[k] === f) ?? f]);
      throw new Error(
        `Could not find a "${field}" column in the Excel file. ` +
        `Expected columns: ${columnNames.join(', ')}. ` +
        `Found: ${headerKeys.join(', ') || '(none)'}`,
      );
    }
  }

  const routes: ImportedRoute[] = [];
  const errors: string[] = [];
  let skipped = 0;

  rawRows.forEach((raw, i) => {
    const rowNum = i + 2; // 1-based + header

    const getField = (field: string): string => {
      const col = fieldToColumn[field];
      if (!col) return '';
      const val = raw[col];
      if (val == null) return '';
      return String(val).trim();
    };

    const getNum = (field: string): number => {
      const col = fieldToColumn[field];
      if (!col) return 0;
      return parseNumber(raw[col]);
    };

    const busNumber = getField('busNumber');
    const routeName = getField('routeName');
    const source = getField('source');
    const destination = getField('destination');
    const distance = getField('distance');
    const estimatedDuration = getField('estimatedDuration');
    const stopsRaw = getField('stops');

    // Validate required fields
    const missing: string[] = [];
    if (!busNumber) missing.push('Bus Number');
    if (!source) missing.push('Source');
    if (!destination) missing.push('Destination');

    if (missing.length > 0) {
      errors.push(`Row ${rowNum}: missing required field(s): ${missing.join(', ')}. Route skipped.`);
      skipped++;
      return;
    }

    // Parse stops (comma, semicolon, or pipe separated)
    const stops: string[] = stopsRaw
      ? stopsRaw
          .split(/[,;|]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [source, destination]; // fallback when no stops provided

    // Parse financial fields with mock defaults when not provided
    const dailyPassengers = getNum('dailyPassengers') || DEFAULT_FINANCES.dailyPassengers;
    const averageFare = getNum('averageFare') || DEFAULT_FINANCES.averageFare;
    const dailyFuelCost = getNum('dailyFuelCost') || DEFAULT_FINANCES.dailyFuelCost;
    const driverSalary = getNum('driverSalary') || DEFAULT_FINANCES.driverSalary;
    const conductorSalary = getNum('conductorSalary') || DEFAULT_FINANCES.conductorSalary;
    const maintenanceCost = getNum('maintenanceCost') || DEFAULT_FINANCES.maintenanceCost;
    const otherExpenses = getNum('otherExpenses') || DEFAULT_FINANCES.otherExpenses;

    const finances: RouteFinances = {
      dailyPassengers,
      averageFare,
      dailyFuelCost,
      driverSalary,
      conductorSalary,
      maintenanceCost,
      otherExpenses,
    };

    // Check for duplicate bus number — update in-place
    const existingIndex = routes.findIndex((r) => r.busNumber.toUpperCase() === busNumber.toUpperCase());
    const route: ImportedRoute = {
      busNumber,
      routeName: routeName || `${source} → ${destination}`,
      source,
      destination,
      stops,
      distance: distance || '-',
      estimatedDuration: estimatedDuration || '-',
      finances,
    };

    if (existingIndex >= 0) {
      routes[existingIndex] = route;
      errors.push(`Row ${rowNum}: bus number "${busNumber}" already exists — route updated.`);
    } else {
      routes.push(route);
    }
  });

  return { routes, skipped, errors };
}

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

const TEMPLATE_ROWS = [
  {
    'Bus Number': '21G',
    'Route Name': 'Broadway to Tambaram',
    Source: 'Broadway',
    Destination: 'Tambaram',
    Stops: 'Broadway, Central, Guindy, Tambaram',
    Distance: '32 km',
    'Estimated Duration': '1 hr 15 min',
    'Daily Passengers': '1500',
    'Average Fare': '12',
    'Daily Fuel Cost': '8500',
    'Driver Salary': '22000',
    'Conductor Salary': '18000',
    'Maintenance Cost': '12000',
    'Other Expenses': '8000',
  },
  {
    'Bus Number': '',
    'Route Name': '',
    Source: '',
    Destination: '',
    Stops: '',
    Distance: '',
    'Estimated Duration': '',
    'Daily Passengers': '',
    'Average Fare': '',
    'Daily Fuel Cost': '',
    'Driver Salary': '',
    'Conductor Salary': '',
    'Maintenance Cost': '',
    'Other Expenses': '',
  },
];

export function downloadTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Routes');
  ws['!cols'] = [
    { wch: 14 }, // Bus Number
    { wch: 28 }, // Route Name
    { wch: 18 }, // Source
    { wch: 18 }, // Destination
    { wch: 50 }, // Stops
    { wch: 12 }, // Distance
    { wch: 20 }, // Estimated Duration
    { wch: 18 }, // Daily Passengers
    { wch: 14 }, // Average Fare
    { wch: 16 }, // Daily Fuel Cost
    { wch: 14 }, // Driver Salary
    { wch: 18 }, // Conductor Salary
    { wch: 18 }, // Maintenance Cost
    { wch: 16 }, // Other Expenses
  ];
  XLSX.writeFile(wb, 'MTC_Routes_Template.xlsx');
}

// ---------------------------------------------------------------------------
// Export current routes as Excel
// ---------------------------------------------------------------------------

export function exportRoutesAsExcel(routes: ImportedRoute[]): void {
  const data = routes.map((r) => ({
    'Bus Number': r.busNumber,
    'Route Name': r.routeName,
    Source: r.source,
    Destination: r.destination,
    Stops: r.stops.join(', '),
    Distance: r.distance,
    'Estimated Duration': r.estimatedDuration,
    'Daily Passengers': String(r.finances.dailyPassengers),
    'Average Fare': String(r.finances.averageFare),
    'Daily Fuel Cost': String(r.finances.dailyFuelCost),
    'Driver Salary': String(r.finances.driverSalary),
    'Conductor Salary': String(r.finances.conductorSalary),
    'Maintenance Cost': String(r.finances.maintenanceCost),
    'Other Expenses': String(r.finances.otherExpenses),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Routes');
  ws['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 50 },
    { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
  ];
  XLSX.writeFile(wb, `MTC_Routes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}