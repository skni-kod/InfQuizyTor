// src/components/widgets/UpcomingEvents.tsx
/* eslint-disable @microsoft/sdl/no-inline-styles */

import { Panel } from "../common/Panel";
import { IconCalendar } from "../../assets/icons";
import styles from "./Widget.module.css";

// Mock data
const events = [
  {
    time: "10:00-11:30",
    title: "Wykład: Analiza Matematyczna",
    source: "USOS",
    color: "var(--info)",
  },
  {
    time: "14:00",
    title: "Wejściówka: Algebra",
    source: "GRUPA C-1",
    color: "var(--error)",
  },
  {
    time: "18:00",
    title: "Spotkanie Koła Naukowego AI",
    source: "SEKCJA AI",
    color: "var(--tertiary)",
  },
];

export const UpcomingEvents = () => {
  return (
    <Panel className={styles.widgetCard}>
      <h2 className={styles.widgetTitle}>
        <IconCalendar />
        <span>Nadchodzące Terminy</span>
      </h2>
      <ul className={styles.widgetList}>
        {events.map((event) => (
          <li key={event.title} className={styles.eventItem}>
            {/* POPRAWKA: Używamy zmiennej CSS */}
            <div
              className={styles.eventTimeBar}
              style={{ "--event-color": event.color } as React.CSSProperties}
            />
            <div className={styles.eventDetails}>
              <span className={styles.eventTitle}>{event.title}</span>
              <span className={styles.eventMeta}>
                {event.time} | Źródło: {event.source}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <button className={styles.primaryButton}>Zobacz Pełny Kalendarz</button>
    </Panel>
  );
};
