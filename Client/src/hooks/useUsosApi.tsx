import { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ZMIANA 1: 'fields' jest teraz opcjonalne (fields?: string)
export const useUsosApi = <T,>(apiPath: string, fields?: string) => {
  const [fetchState, setFetchState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const { authState } = useAppContext(); // Używamy obiektu authState

  useEffect(() => {
    const fetchData = async () => {
      if (!apiPath) {
        setFetchState({
          data: null,
          loading: false,
          error: "Brak ścieżki API.",
        });
        return;
      }
      setFetchState({ data: null, loading: true, error: null });

      try {
        console.log(`useUsosApi: Pobieranie ${apiPath}...`);
        // Endpoint teraz poprawnie trafia do /api/services/...
        const backendApiUrl = `/api/${apiPath}`;

        // ZMIANA 2: Budujemy URL warunkowo
        let fullUrl = backendApiUrl;
        if (fields) {
          const params = new URLSearchParams({ fields });
          fullUrl += `?${params.toString()}`;
        }

        const response = await fetch(fullUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          let errorBody = `Błąd backendu! Status: ${response.status}`;
          try {
            // Spróbuj sparsować błąd JSON (np. z USOS)
            const errorData = await response.json();
            errorBody += ` - ${
              errorData.message || errorData.details || errorData.error
            }`;
          } catch (e) {
            // Jeśli USOS zwróci 404 (jako HTML), to json() się nie uda
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

    // Używamy stanu z obiektu authState
    if (authState.authLoading) {
      setFetchState((prev) => ({ ...prev, loading: true }));
    } else if (authState.user) {
      fetchData();
    } else {
      setFetchState({
        data: null,
        loading: false,
        error: "Użytkownik nie jest zalogowany.",
      });
    }
  }, [apiPath, fields, authState.user, authState.authLoading]); // Zależności są poprawne

  return fetchState;
};
