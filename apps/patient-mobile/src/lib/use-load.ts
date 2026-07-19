import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

type InternalState<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export type LoadState<T> = InternalState<T> & {
  reload: () => void;
  refresh: () => void;
};

/**
 * Ladeverhalten v1 (D-060): beim Öffnen laden, beim Zurückkehren der
 * App aktualisieren, Pull-to-refresh; Fehler landen sichtbar im
 * Zustand statt in einer stillen Konsole.
 */
export function useLoad<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): LoadState<T> {
  const [state, setState] = useState<InternalState<T>>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
  });
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(async (asRefresh: boolean) => {
    if (asRefresh) {
      setState((previous) => ({ ...previous, refreshing: true, error: null }));
    }
    try {
      const result = await loaderRef.current();
      setState({ data: result, loading: false, refreshing: false, error: null });
    } catch (loadError) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error:
          loadError instanceof Error ? loadError.message : String(loadError),
      }));
    }
  }, []);

  useEffect(() => {
    run(false);
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") run(true);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return {
    ...state,
    reload: () => {
      setState((previous) => ({ ...previous, loading: true }));
      run(false);
    },
    refresh: () => run(true),
  };
}
