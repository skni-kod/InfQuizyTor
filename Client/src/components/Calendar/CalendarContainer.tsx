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

  const fetchCalendarData = useCallback(async () => {
    if (!authState.user) return;

    setLoading(true);
    setError(null);

    // ZMIANA: Pobieramy tylko 7 dni wstecz, aby priorytetyzować aktualny i przyszły czas
    // Backend teraz obsługuje większe "days", więc pobieramy 60 dni w przód.
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const startStr = start.toISOString().split("T")[0];
    const days = "60"; // Pobieramy 2 miesiące danych

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

      const normalizedEvents = (data.events || []).map((ev) => ({
        ...ev,
        start_time: ev.start_time ? ev.start_time.replace(" ", "T") : "",
        end_time: ev.end_time ? ev.end_time.replace(" ", "T") : null,
      }));

      setAllEvents(normalizedEvents);
      setLayers(data.layers || {});

      if (
        activeLayerIDs.size === 0 &&
        data.layers &&
        Object.keys(data.layers).length > 0
      ) {
        setActiveLayerIDs(new Set(Object.keys(data.layers)));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  }, [authState.user]);

  useEffect(() => {
    if (authState.authLoading) {
      setLoading(true);
    } else if (authState.user) {
      fetchCalendarData();
    } else {
      setError("Zaloguj się, aby zobaczyć plan.");
      setLoading(false);
    }
  }, [authState.user, authState.authLoading, fetchCalendarData]);

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
  };

  const goToDate = (date: Date, newView: ViewType) => {
    setCurrentDate(date);
    setView(newView);
  };

  const filteredEvents = useMemo(
    () => allEvents.filter((event) => activeLayerIDs.has(event.layerId)),
    [allEvents, activeLayerIDs]
  );

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
