import * as XLSX from 'xlsx';
import type { ImportedRoute, ImportResult } from '../types';

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
};

/** Required fields that must be present and non-empty */
const REQUIRED_FIELDS = ['busNumber', 'source', 'destination'];

/**
 * Read an Excel ArrayBuffer, parse the first worksheet, and return
 * validated ImportedRoute objects.
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
      // Try a second pass — search for partial matches if no exact match
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
  },
  {
    'Bus Number': '',
    'Route Name': '',
    Source: '',
    Destination: '',
    Stops: '',
    Distance: '',
    'Estimated Duration': '',
  },
];

export function downloadTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Routes');
  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Bus Number
    { wch: 28 }, // Route Name
    { wch: 18 }, // Source
    { wch: 18 }, // Destination
    { wch: 40 }, // Stops
    { wch: 12 }, // Distance
    { wch: 20 }, // Estimated Duration
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
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Routes');
  ws['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 50 },
    { wch: 12 },
    { wch: 20 },
  ];
  XLSX.writeFile(wb, `MTC_Routes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}