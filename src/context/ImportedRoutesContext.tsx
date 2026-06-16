import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ImportedRoute, ImportState } from '../types';

const STORAGE_KEY = 'mtc_imported_routes';

interface ImportedRoutesContextValue {
  importedRoutes: ImportedRoute[];
  metadata: ImportState['metadata'];
  setImportedData: (routes: ImportedRoute[], fileName: string) => void;
  clearImportedData: () => void;
}

const ImportedRoutesContext = createContext<ImportedRoutesContextValue | undefined>(undefined);

function loadFromStorage(): ImportState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ImportState;
      if (Array.isArray(parsed.routes)) {
        return parsed;
      }
    }
  } catch {
    // Invalid stored data — ignore
  }
  return { routes: [], metadata: null };
}

function saveToStorage(state: ImportState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn('[ImportedRoutesContext] Unable to write to localStorage.');
  }
}

export function ImportedRoutesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImportState>(loadFromStorage);

  // Sync to localStorage on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const setImportedData = (routes: ImportedRoute[], fileName: string) => {
    setState({
      routes,
      metadata: {
        fileName,
        timestamp: Date.now(),
        totalRoutes: routes.length,
      },
    });
  };

  const clearImportedData = () => {
    setState({ routes: [], metadata: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ImportedRoutesContext.Provider
      value={{
        importedRoutes: state.routes,
        metadata: state.metadata,
        setImportedData,
        clearImportedData,
      }}
    >
      {children}
    </ImportedRoutesContext.Provider>
  );
}

export function useImportedRoutes(): ImportedRoutesContextValue {
  const ctx = useContext(ImportedRoutesContext);
  if (!ctx) {
    throw new Error('useImportedRoutes must be used within ImportedRoutesProvider');
  }
  return ctx;
}