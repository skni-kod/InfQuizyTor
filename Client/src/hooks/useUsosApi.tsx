import { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useUsosApi = <T,>(apiPath: string, fields?: string) => {
  const [fetchState, setFetchState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const { user, authLoading } = useAppContext();

  useEffect(() => {
    const fetchData = async () => {
      if (!apiPath) {
        setFetchState({
          data: null,
          loading: false,
          error: "Brak ścieżki lub pól API.",
        });
        return;
      }
      setFetchState({ data: null, loading: true, error: null });

      try {
        console.log(`useUsosApi: Pobieranie ${apiPath}...`);
        const backendApiUrl = `/api/${apiPath}`;
        let fullUrl = backendApiUrl;
        if (fields) {
          const params = new URLSearchParams({ fields });
          fullUrl += `?${params.toString()}`;
        }

        // Używamy 'fullUrl' zamiast starej logiki
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          let errorBody = `Błąd backendu! Status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorBody += ` - ${
              errorData.message || errorData.details || errorData.error
            }`;
          } catch (e) {
            errorBody += " (Nie można sparsować błędu JSON)";
          }
          throw new Error(errorBody);
        }
        const data: T = await response.json();
        setFetchState({ data, loading: false, error: null });
      } catch (err) {
        console.error(`useUsosApi: Błąd pobierania ${apiPath}:`, err);
        setFetchState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Nieznany błąd",
        });
      }
    };

    if (authLoading) {
      setFetchState((prev) => ({ ...prev, loading: true }));
    } else if (user) {
      fetchData();
    } else {
      setFetchState({
        data: null,
        loading: false,
        error: "Użytkownik nie jest zalogowany.",
      });
    }
  }, [apiPath, fields, user, authLoading]); // 'fields' jest już w zależnościach

  return fetchState;
};
