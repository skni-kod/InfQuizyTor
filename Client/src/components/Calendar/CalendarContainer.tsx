import React, { useState, useEffect } from "react";
import UsosCalendar from "./UsosCalendar";
import { AppCalendarEvent, AppCalendarResponse } from "../../assets/types.tsx";

// --- POPRAWIONY MOCK ---
// Używamy 'Partial<LangDict>' aby dopasować do 'AppCalendarEvent'
const MOCK_API_RESPONSE: AppCalendarResponse = {
  events: [
    {
      id: "usos1",
      start_time: "2025-11-20T10:00:00",
      name: { pl: "Wykład Analiza" },
      layerId: "usos-other",
    },
    {
      id: "usos2",
      start_time: "2025-11-21T12:00:00",
      name: { pl: "Egzamin Logika" },
      layerId: "usos-exam",
    },
    {
      id: "priv1",
      start_time: "2025-11-20T18:00:00",
      title: "Spotkanie Koła AI",
      name: {},
      layerId: "layer-private-1",
    },
    {
      id: "group1",
      start_time: "2025-11-22T08:00:00",
      title: "Wejściówka L01",
      name: {},
      layerId: "layer-group-1",
    },
  ],
  layers: {
    "usos-other": { name: "Zajęcia USOS", color: "#555" },
    "usos-exam": { name: "Egzaminy USOS", color: "#E74C3C" },
    "layer-private-1": { name: "Moje Koło AI", color: "#3498DB" },
    "layer-group-1": { name: "Wejściówki L01", color: "#F1C40F" },
  },
};
// --- KONIEC POPRAWIONEGO MOCKA ---

const CalendarContainer: React.FC = () => {
  const [allEvents, setAllEvents] = useState<AppCalendarEvent[]>([]);
  const [layers, setLayers] = useState<
    Record<string, { name: string; color: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLayerIDs, setActiveLayerIDs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // TODO: Zastąp mock prawdziwym wywołaniem API /api/calendar/all-events
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data: AppCalendarResponse = MOCK_API_RESPONSE;

        setAllEvents(data.events);
        setLayers(data.layers);
        setActiveLayerIDs(new Set(Object.keys(data.layers)));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  const toggleFilter = (layerId: string) => {
    setActiveLayerIDs((prevFilters) => {
      const newFilters = new Set(prevFilters);
      if (newFilters.has(layerId)) {
        newFilters.delete(layerId);
      } else {
        newFilters.add(layerId);
      }
      return newFilters;
    });
  };

  const filteredEvents = allEvents.filter((event) =>
    activeLayerIDs.has(event.layerId)
  );

  return (
    <UsosCalendar
      allEvents={filteredEvents}
      availableLayers={layers}
      activeLayerIDs={activeLayerIDs}
      onToggleLayer={toggleFilter}
      loading={loading}
      error={error}
    />
  );
};

export default CalendarContainer;
