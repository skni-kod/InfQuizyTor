import React, { useMemo } from "react";
import { AppCalendarEvent } from "../../assets/types.tsx";
import styles from "./UsosCalendar.module.scss";

interface UsosCalendarProps {
  allEvents: AppCalendarEvent[];
  availableLayers: Record<string, { name: string; color: string }>;
  activeLayerIDs: Set<string>;
  onToggleLayer: (layerId: string) => void;
  loading: boolean;
  error: string | null;
}

// --- POPRAWKA: Funkcje pomocnicze MUSZĄ zwracać wartość ---
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Błędny Czas"; // <-- Zwracamy string błędu
  }
};
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "Błędna Data"; // <-- Zwracamy string błędu
  }
};
// --- KONIEC POPRAWKI ---

const groupEventsByDate = (
  events: AppCalendarEvent[]
): { [date: string]: AppCalendarEvent[] } => {
  return events.reduce((acc, event) => {
    const dateStr = formatDate(event.start_time);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    acc[dateStr].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return acc;
  }, {} as { [date: string]: AppCalendarEvent[] });
};

const UsosCalendar: React.FC<UsosCalendarProps> = ({
  allEvents,
  availableLayers,
  activeLayerIDs,
  onToggleLayer,
  loading,
  error,
}) => {
  const groupedEvents = useMemo(
    () => groupEventsByDate(allEvents),
    [allEvents]
  );
  const sortedDates = useMemo(
    () =>
      Object.keys(groupedEvents).sort(
        (a, b) =>
          new Date(groupedEvents[a][0].start_time).getTime() -
          new Date(groupedEvents[b][0].start_time).getTime()
      ),
    [groupedEvents]
  );

  if (loading) {
    return <div className={styles.loading}>Ładowanie kalendarza... ⏳</div>;
  }
  if (error) {
    return <div className={styles.error}>Błąd ładowania: {error} 😥</div>;
  }

  return (
    <div className={styles.calendarContainer}>
      <h2>Twój Kalendarz USOS</h2>

      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Warstwy:</span>
        {Object.entries(availableLayers).map(([layerId, { name, color }]) => (
          <button
            key={layerId}
            className={`${styles.filterButton} ${
              activeLayerIDs.has(layerId) ? styles.active : ""
            }`}
            onClick={() => onToggleLayer(layerId)}
            style={{ "--layer-color": color } as React.CSSProperties}
          >
            {name}
          </button>
        ))}
      </div>

      {allEvents.length === 0 && !loading ? (
        <div className={styles.noEvents}>
          Brak wydarzeń (lub sprawdź aktywne filtry). 🎉
        </div>
      ) : (
        sortedDates.map((dateStr) => (
          <div key={dateStr} className={styles.dayGroup}>
            <h3>
              {dateStr}
              <span className={styles.dayOfWeek}>
                {new Date(
                  groupedEvents[dateStr][0].start_time
                ).toLocaleDateString("pl-PL", { weekday: "long" })}
              </span>
            </h3>
            <ul className={styles.eventList}>
              {groupedEvents[dateStr].map((event, index) => (
                <li
                  key={`${event.id}-${index}`}
                  className={styles.eventItem}
                  style={
                    {
                      "--layer-color":
                        availableLayers[event.layerId]?.color || "#555",
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.eventTime}>
                    {formatDateTime(event.start_time)}
                    {event.end_time &&
                      formatDateTime(event.end_time) !==
                        formatDateTime(event.start_time) &&
                      ` - ${formatDateTime(event.end_time)}`}
                  </span>
                  <span className={styles.eventName}>
                    {event.title ||
                      event.course_name?.pl ||
                      event.name?.pl ||
                      event.name?.en ||
                      "Brak nazwy"}
                    {event.classtype_name?.pl &&
                      ` (${event.classtype_name.pl})`}
                  </span>
                  {(event.room_number || event.building_name?.pl) && (
                    <span className={styles.eventLocation}>
                      {event.room_number} {event.building_name?.pl}
                    </span>
                  )}
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.eventLink}
                    >
                      🔗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default UsosCalendar;
