import React, { useState, useEffect } from "react";
// Use the original user event type
import {
  UsosCalendarEvent,
  UsosCalendarResponse,
} from "../../assets/types.tsx"; // Adjust path if needed
import styles from "./UsosCalendar.module.scss";
// Import the placeholder function for getting OAuth 1.0a headers (REPLACE WITH REAL IMPLEMENTATION)
import getUsosAuthHeaders from "../../services/usosAuth"; // Adjust path if needed

// Base URL for the USOS API instance
const USOS_API_BASE_URL = "http://localhost:8080";

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

// Formats date to YYYY-MM-DD for API parameters (if needed for user_events, check API docs)
// const toApiDateString = (date: Date): string => { /* ... */ };

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
    // Sort events within each day by start_time
    acc[dateStr].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return acc;
  }, {} as { [date: string]: UsosCalendarEvent[] });
};

// --- Main Calendar Component ---
// No props needed if fetching the logged-in user's calendar
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
        console.log("Fetching USOS User Calendar events...");
        // Get OAuth 1.0a signed headers (REPLACE placeholder!)
        const authHeaders = await getUsosAuthHeaders();

        // --- Prepare API Call using 'user_events' endpoint ---
        // Adjust fields as needed based on user_events documentation
        const fields = "id|name|type|start_time|end_time|url";
        // Add date range parameters if supported/needed by user_events
        // Example: const startDateStr = toApiDateString(new Date());
        // Example: const endDate = new Date(); endDate.setDate(endDate.getDate() + 30);
        // Example: const endDateStr = toApiDateString(endDate);
        const params = new URLSearchParams({
          fields: fields,
          // start: startDateStr, // Add if API supports filtering by date
          // end: endDateStr,   // Add if API supports filtering by date
        });

        const apiUrl = `${USOS_API_BASE_URL}/services/calendar/user_events?${params.toString()}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: authHeaders, // Use the OAuth 1.0a headers
        });

        // Handle HTTP errors and specific USOS errors
        if (!response.ok) {
          let errorBody = "";
          try {
            const errorData = await response.json();
            errorBody = errorData.message || JSON.stringify(errorData);
            // Add specific error code checks if needed for user_events
          } catch (e) {
            errorBody = await response.text();
          }
          throw new Error(
            `HTTP error! Status: ${response.status} - ${errorBody}`
          );
        }

        const data: UsosCalendarResponse = await response.json(); // Expecting array of events
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
  // Get sorted date keys
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    // Basic sort assuming consistent date format from formatDate
    return (
      new Date(
        events.find((e) => formatDate(e.start_time) === a)!.start_time
      ).getTime() -
      new Date(
        events.find((e) => formatDate(e.start_time) === b)!.start_time
      ).getTime()
    );
  });

  // --- Render Logic ---
  if (loading) {
    return <div className={styles.loading}>Ładowanie kalendarza... ⏳</div>;
  }
  if (error) {
    // Provide a more user-friendly error, maybe suggest re-authentication
    return (
      <div className={styles.error}>
        Błąd ładowania kalendarza: {error} 😥 <br /> Spróbuj odświeżyć stronę
        lub zaloguj się ponownie.
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
              // Use UsosCalendarEvent type here
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
                {/* No is_day_off in user_events? Check API response if needed */}
                {/* {event.is_day_off && <span className={styles.dayOffLabel}>Wolne</span>} */}
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
