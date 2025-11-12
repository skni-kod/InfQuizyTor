import React, { useState, useEffect } from "react";
import {
  UsosCalendarEvent,
  UsosCalendarResponse,
} from "../../assets/types.tsx";
import styles from "./UsosCalendar.module.scss";
import { useAppContext } from "../../contexts/AppContext"; // Importuj kontekst

// --- Funkcje pomocnicze (formatDateTime, formatDate) ---
// (Zakładam, że są tutaj)
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Invalid Time";
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
    return "Invalid Date";
  }
};
const groupEventsByDate = (
  events: UsosCalendarEvent[]
): { [date: string]: UsosCalendarEvent[] } => {
  return events.reduce((acc, event) => {
    const dateStr = formatDate(event.start_time);
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    acc[dateStr].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return acc;
  }, {} as { [date: string]: UsosCalendarEvent[] });
};
// --- Koniec Funkcji Pomocniczych ---

const UsosCalendar: React.FC = () => {
  const [events, setEvents] = useState<UsosCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- POPRAWKA ---
  const { authState } = useAppContext();
  // --- KONIEC POPRAWKI ---

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log("Fetching USOS User Calendar events via backend proxy...");
        const backendApiUrl = "/api/services/tt/user";
        // Poprawiona lista pól (bez 'id', bez nawiasów)
        const fields =
          "name|type|start_time|end_time|url|building_name|room_number|course_name|lecturer_ids|classtype_name";
        const params = new URLSearchParams({ fields });

        const response = await fetch(`${backendApiUrl}?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          let errorBody = `Backend error! Status: ${response.status}`;
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

        const data: UsosCalendarResponse = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch USOS user events:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    // --- POPRAWKA ---
    if (authState.authLoading) {
      setLoading(true);
    } else if (authState.user) {
      fetchEvents();
    } else {
      setError("Musisz być zalogowany, aby zobaczyć kalendarz.");
      setLoading(false);
    }
  }, [authState.user, authState.authLoading]); // Zależności od authState
  // --- KONIEC POPRAWKI ---

  // --- Render Logic ---
  if (loading) {
    return <div className={styles.loading}>Ładowanie kalendarza... ⏳</div>;
  }
  if (error) {
    return (
      <div className={styles.error}>
        Błąd ładowania kalendarza: {error} 😥 <br /> Spróbuj ponownie później.
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) =>
      new Date(groupedEvents[a][0].start_time).getTime() -
      new Date(groupedEvents[b][0].start_time).getTime()
  );

  if (events.length === 0 && !loading) {
    return (
      <div className={styles.noEvents}>
        Brak nadchodzących wydarzeń w kalendarzu. 🎉
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <h2>Twój Kalendarz USOS</h2>
      {sortedDates.map((dateStr) => (
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
            {groupedEvents[dateStr].map((event) => (
              <li
                key={`${event.start_time}-${event.name.pl || event.name.en}`}
                className={`${styles.eventItem} ${
                  styles[event.type] || styles.default
                }`}
              >
                <span className={styles.eventTime}>
                  {formatDateTime(event.start_time)}
                  {event.end_time &&
                    formatDateTime(event.end_time) !==
                      formatDateTime(event.start_time) &&
                    ` - ${formatDateTime(event.end_time)}`}
                </span>
                <span className={styles.eventName}>
                  {event.course_name?.pl ||
                    event.name.pl ||
                    event.name.en ||
                    "Brak nazwy"}
                  {event.classtype_name?.pl && ` (${event.classtype_name.pl})`}
                </span>
                {(event.room_number || event.building_name) && (
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
      ))}
    </div>
  );
};

export default UsosCalendar;
