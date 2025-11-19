import React, { useState, useEffect, useCallback, useMemo } from "react";
import UsosCalendar, { ViewType } from "./UsosCalendar";
import {
  AppCalendarEvent,
  AppCalendarResponse,
  CalendarLayerDefinition,
} from "../../assets/types.tsx";
import { useAppContext } from "../../contexts/AppContext";

const CalendarContainer: React.FC = () => {
  const { authState } = useAppContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("week");

  const [allEvents, setAllEvents] = useState<AppCalendarEvent[]>([]);
  const [layers, setLayers] = useState<Record<string, CalendarLayerDefinition>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLayerIDs, setActiveLayerIDs] = useState<Set<string>>(new Set());

  // --- FUNKCJA POBIERANIA DANYCH ---
  const fetchCalendarData = useCallback(async () => {
    if (!authState.user) return;

    setLoading(true);
    setError(null);

    // Pobieramy dane dla aktualnie wybranego tygodnia (widocznego w kalendarzu)
    // Backend wymusza 7 dni, więc musimy prosić dokładnie o ten tydzień, który oglądamy.
    const start = new Date(currentDate);
    // Ustawiamy na początek tygodnia (poniedziałek), żeby pobrać pełny widok
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const startStr = start.toISOString().split("T")[0];
    const days = "7"; // Prosimy o 7 dni, bo tyle daje USOS

    const backendApiUrl = "/api/calendar/all-events";
    const params = new URLSearchParams({ start: startStr, days: days });

    try {
      const response = await fetch(`${backendApiUrl}?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`Błąd API: ${response.status}`);

      const data: AppCalendarResponse = await response.json();

      // Normalizacja dat
      const normalizedEvents = (data.events || []).map((ev) => ({
        ...ev,
        start_time: ev.start_time ? ev.start_time.replace(" ", "T") : "",
        end_time: ev.end_time ? ev.end_time.replace(" ", "T") : null,
      }));

      setAllEvents(normalizedEvents);

      const fetchedLayers = data.layers || {};
      setLayers(fetchedLayers);

      // Automatycznie włączamy warstwy, jeśli żadna nie jest wybrana
      setActiveLayerIDs((prev) => {
        if (prev.size > 0) return prev;
        if (Object.keys(fetchedLayers).length > 0) {
          return new Set(Object.keys(fetchedLayers));
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  }, [authState.user, currentDate]); // ZALEŻNOŚĆ OD currentDate JEST KLUCZOWA

  // Pobieraj dane przy zmianie usera LUB zmianie daty (nawigacji)
  useEffect(() => {
    if (authState.authLoading) {
      setLoading(true);
    } else if (authState.user) {
      fetchCalendarData();
    } else {
      setError("Zaloguj się, aby zobaczyć plan.");
      setLoading(false);
    }
  }, [fetchCalendarData, authState.authLoading, authState.user]);

  const toggleFilter = (layerId: string) => {
    setActiveLayerIDs((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const sign = direction === "next" ? 1 : -1;
    if (view === "month") newDate.setMonth(newDate.getMonth() + sign);
    else if (view === "week") newDate.setDate(newDate.getDate() + sign * 7);
    else newDate.setDate(newDate.getDate() + sign);
    setCurrentDate(newDate);
    // useEffect wykryje zmianę currentDate i pobierze nowe dane
  };

  const goToDate = (date: Date, newView: ViewType) => {
    setCurrentDate(date);
    setView(newView);
  };

  const filteredEvents = useMemo(() => {
    if (activeLayerIDs.size === 0 && Object.keys(layers).length > 0) {
      return allEvents;
    }
    return allEvents.filter((event) => activeLayerIDs.has(event.layerId));
  }, [allEvents, activeLayerIDs, layers]);

  return (
    <UsosCalendar
      allEvents={filteredEvents}
      availableLayers={layers}
      activeLayerIDs={activeLayerIDs}
      onToggleLayer={toggleFilter}
      loading={loading}
      error={error}
      currentDate={currentDate}
      view={view}
      onViewChange={setView}
      onNavigate={handleNavigate}
      onGoToDate={goToDate}
    />
  );
};

export default CalendarContainer;
