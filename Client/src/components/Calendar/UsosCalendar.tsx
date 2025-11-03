import React, { useState, useEffect } from "react";
// Import type for user-specific calendar events
import {
  UsosCalendarEvent,
  UsosCalendarResponse,
} from "../../assets/types.tsx"; // Correct path to types in assets
import styles from "./UsosCalendar.module.scss";

// --- Helper Functions ---

// Formats time (e.g., 10:00)
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Error formatting date/time:", e);
    return "Invalid Time";
  }
};

// Formats date (e.g., 29 października 2025)
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

// Groups events by their formatted date string
const groupEventsByDate = (
  events: UsosCalendarEvent[]
): { [date: string]: UsosCalendarEvent[] } => {
  return events.reduce((acc, event) => {
    const dateStr = formatDate(event.start_time); // Group by start_time
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

// --- Main Calendar Component ---
// Fetches the logged-in user's calendar events via the backend proxy
const UsosCalendar: React.FC = () => {
  const [events, setEvents] = useState<UsosCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      setEvents([]);

      try {
        console.log("Fetching USOS User Calendar events via backend proxy...");

        // --- API Call to Backend Proxy ---
        // Define the backend endpoint that proxies to USOS API services/calendar/user_events
        // The backend's AuthRequired middleware handles user identification via session.
        const backendApiUrl = "/api/services/calendar/user_events"; // Relative URL to your Go backend proxy endpoint

        // Add desired fields as query parameters for the backend proxy to forward
        const fields = "id|name|type|start_time|end_time|url";
        const params = new URLSearchParams({ fields });

        const response = await fetch(`${backendApiUrl}?${params.toString()}`, {
          /* ... */
        });

        // Handle HTTP errors from the backend proxy
        if (!response.ok) {
          let errorBody = `Backend error! Status: ${response.status}`;

          // --- POPRAWKA ---
          // Odczytaj odpowiedź jako ZWYKŁY TEKST, ponieważ może to być HTML
          const textError = await response.text();

          // Spróbuj sparsować jako JSON na wypadek, gdyby backend *jednak* wysłał JSON
          try {
            const errorData = JSON.parse(textError);
            errorBody += ` - ${
              errorData.details || errorData.error || textError
            }`;
          } catch (e) {
            // Jeśli parsowanie JSON się nie udało, po prostu dołącz tekst błędu (HTML)
            // Usuń tagi HTML dla czytelności w konsoli (opcjonalne)
            const cleanTextError = textError.replace(/<[^>]*>?/gm, "");
            errorBody += ` - (Response was HTML/Text): ${cleanTextError.substring(
              0,
              100
            )}...`; // Pokaż tylko fragment
          }
          // --- KONIEC POPRAWKI ---

          throw new Error(errorBody); // Rzuć pełnym błędem
        }

        // If response IS ok, parse as JSON
        const data: UsosCalendarResponse = await response.json();
        setEvents(data);
        // --- End API Call ---
      } catch (err) {
        console.error("Failed to fetch USOS user events:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []); // Runs once on mount

  // Group events by date for rendering
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    // Basic sort assuming consistent date format from formatDate
    return (
      new Date(groupedEvents[a][0].start_time).getTime() -
      new Date(groupedEvents[b][0].start_time).getTime()
    );
  });

  // --- Render Logic ---
  if (loading) {
    return <div className={styles.loading}>Ładowanie kalendarza... ⏳</div>;
  }
  if (error) {
    return (
      <div className={styles.error}>
        Błąd ładowania kalendarza: {error} 😥 <br /> Sprawdź połączenie lub
        spróbuj ponownie później.
      </div>
    );
  }
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
                key={event.id}
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
                  {event.name.pl || event.name.en || "Brak nazwy"}
                </span>
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
