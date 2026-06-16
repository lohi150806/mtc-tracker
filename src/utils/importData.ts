import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ImportedRoute, ImportedStop } from '../types';

/**
 * Validate that a parsed object conforms to the ImportedRoute schema.
 * Returns the validated route or a string describing what failed.
 */
function validateRoute(raw: Record<string, unknown>, index: number): { route: ImportedRoute } | { error: string } {
  const busNumber = String(raw.busNumber ?? raw.BusNumber ?? raw['Bus Number'] ?? '').trim();
  const source = String(raw.source ?? raw.Source ?? raw.origin ?? raw.Origin ?? '').trim();
  const destination = String(raw.destination ?? raw.Destination ?? raw.dest ?? raw.Dest ?? '').trim();
  const stopsRaw = raw.stops ?? raw.Stops ?? raw.routeStops ?? raw.RouteStops ?? '';

  if (!busNumber) {
    return { error: `Row ${index}: "busNumber" is required.` };
  }
  if (!source) {
    return { error: `Row ${index}: "source" is required.` };
  }
  if (!destination) {
    return { error: `Row ${index}: "destination" is required.` };
  }

  let stops: (string | ImportedStop)[] = [];

  if (typeof stopsRaw === 'string') {
    // Parse semicolon or comma-separated list
    const separator = stopsRaw.includes(';') ? ';' : ',';
    stops = stopsRaw
      .split(separator)
      .map((s: string) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(stopsRaw)) {
    stops = stopsRaw.map((s: unknown) => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object') {
        const obj = s as Record<string, unknown>;
        return {
          name: String(obj.name ?? ''),
          lat: obj.lat != null ? Number(obj.lat) : undefined,
          lng: obj.lng != null ? Number(obj.lng) : undefined,
        } as ImportedStop;
      }
      return String(s);
    }).filter((s) => (typeof s === 'string' ? s.length > 0 : (s as ImportedStop).name.length > 0));
  }

  if (stops.length === 0) {
    return { error: `Row ${index}: "stops" must be a non-empty array or delimited string.` };
  }

  return {
    route: { busNumber, source, destination, stops },
  };
}

/**
 * Parse a CSV string into an array of ImportedRoute objects.
 */
export function parseCsv(text: string): ImportedRoute[] {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(`CSV parse error near row ${firstError.row ?? '?'}: ${firstError.message}`);
  }

  const routes: ImportedRoute[] = [];
  const errors: string[] = [];

  result.data.forEach((raw, i) => {
    const validated = validateRoute(raw, i + 2); // +2 for 1-based + header row
    if ('error' in validated) {
      errors.push(validated.error);
    } else {
      routes.push(validated.route);
    }
  });

  if (routes.length === 0 && errors.length > 0) {
    throw new Error(`No valid routes found. ${errors[0]}`);
  }

  if (errors.length > 0) {
    console.warn(`[importData] ${errors.length} row(s) skipped:\n${errors.join('\n')}`);
  }

  return routes;
}

/**
 * Parse an Excel ArrayBuffer into an array of ImportedRoute objects.
 */
export function parseExcel(buffer: ArrayBuffer): ImportedRoute[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    throw new Error('Excel file has no sheets.');
  }

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
  const routes: ImportedRoute[] = [];
  const errors: string[] = [];

  json.forEach((raw, i) => {
    const validated = validateRoute(raw, i + 2);
    if ('error' in validated) {
      errors.push(validated.error);
    } else {
      routes.push(validated.route);
    }
  });

  if (routes.length === 0 && errors.length > 0) {
    throw new Error(`No valid routes found. ${errors[0]}`);
  }

  if (errors.length > 0) {
    console.warn(`[importData] ${errors.length} row(s) skipped:\n${errors.join('\n')}`);
  }

  return routes;
}

/**
 * Parse a JSON string into an array of ImportedRoute objects.
 */
export function parseJson(text: string): ImportedRoute[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file. Please check the file contents and try again.');
  }

  let rawArray: Record<string, unknown>[];

  if (Array.isArray(parsed)) {
    rawArray = parsed as Record<string, unknown>[];
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    // Try common wrapping keys
    const possible = obj.routes ?? obj.data ?? obj.items ?? null;
    if (Array.isArray(possible)) {
      rawArray = possible;
    } else {
      // If it looks like a single route object, wrap it
      if (obj.busNumber || obj.BusNumber) {
        rawArray = [obj];
      } else {
        throw new Error('JSON file must contain an array of routes or an object with a "routes" field.');
      }
    }
  } else {
    throw new Error('JSON file must contain an array of route objects.');
  }

  const routes: ImportedRoute[] = [];
  const errors: string[] = [];

  rawArray.forEach((raw, i) => {
    const validated = validateRoute(raw, i + 1);
    if ('error' in validated) {
      errors.push(validated.error);
    } else {
      routes.push(validated.route);
    }
  });

  if (routes.length === 0 && errors.length > 0) {
    throw new Error(`No valid routes found. ${errors[0]}`);
  }

  if (errors.length > 0) {
    console.warn(`[importData] ${errors.length} row(s) skipped:\n${errors.join('\n')}`);
  }

  return routes;
}