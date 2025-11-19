import React, { useMemo } from "react";
import { AppCalendarEvent, CalendarLayerDefinition } from "../../assets/types";
import styles from "./UsosCalendar.module.scss";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

export type ViewType = "day" | "week" | "month";

const START_HOUR = 7;
const END_HOUR = 21;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;
const HEADER_HEIGHT = 50;
const HOUR_HEIGHT = 60;

// Bezpieczne parsowanie
const parseDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr); // Zakładamy, że format ISO został zapewniony w kontenerze
};

interface VisualEvent extends AppCalendarEvent {
  visualLeft: number;
  visualWidth: number;
}

const processOverlaps = (events: AppCalendarEvent[]): VisualEvent[] => {
  const sorted = [...events].sort((a, b) => {
    if (a.start_time === b.start_time) {
      const endA = parseDate(a.end_time).getTime();
      const endB = parseDate(b.end_time).getTime();
      return endB - endA;
    }
    return a.start_time.localeCompare(b.start_time);
  });

  const processed: VisualEvent[] = [];
  let cluster: VisualEvent[] = [];
  let clusterEnd: number | null = null;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const width = 100 / cluster.length;
    cluster.forEach((ev, i) => {
      ev.visualLeft = i * width;
      ev.visualWidth = width;
    });
    cluster = [];
    clusterEnd = null;
  };

  for (const ev of sorted) {
    const start = parseDate(ev.start_time).getTime();
    const end = ev.end_time
      ? parseDate(ev.end_time).getTime()
      : start + 90 * 60000;

    if (clusterEnd !== null && start >= clusterEnd) {
      flushCluster();
    }

    const visualEv: VisualEvent = {
      ...ev,
      visualLeft: 0,
      visualWidth: 100,
    };

    cluster.push(visualEv);
    processed.push(visualEv);

    if (clusterEnd === null || end > clusterEnd) {
      clusterEnd = end;
    }
  }
  flushCluster();
  return processed;
};

interface UsosCalendarProps {
  allEvents: AppCalendarEvent[];
  availableLayers: Record<string, CalendarLayerDefinition>;
  activeLayerIDs: Set<string>;
  onToggleLayer: (layerId: string) => void;
  loading: boolean;
  error: string | null;
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onGoToDate: (date: Date, newView: ViewType) => void;
}

const getMonday = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const isSameDate = (d1: Date, d2: Date) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const formatHeaderDate = (date: Date, view: ViewType) => {
  if (view === "month") {
    return date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const start = getMonday(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString(
        "pl-PL",
        { month: "long" }
      )} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${start.toLocaleDateString("pl-PL", {
      month: "short",
    })} - ${end.getDate()} ${end.toLocaleDateString("pl-PL", {
      month: "short",
    })} ${end.getFullYear()}`;
  }
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const UsosCalendar: React.FC<UsosCalendarProps> = ({
  allEvents = [],
  availableLayers,
  activeLayerIDs,
  onToggleLayer,
  loading,
  error,
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onGoToDate,
}) => {
  const { visibleEvents, processedEvents } = useMemo(() => {
    if (!allEvents) return { visibleEvents: [], processedEvents: [] };

    const start =
      view === "week" ? getMonday(currentDate) : new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    if (view === "month") start.setDate(1);

    const end = new Date(start);
    if (view === "week") end.setDate(end.getDate() + 7);
    else if (view === "day") end.setDate(end.getDate() + 1);
    else end.setMonth(end.getMonth() + 1);

    const filtered = allEvents.filter((ev) => {
      const evDate = parseDate(ev.start_time);
      return evDate >= start && evDate < end;
    });

    const processed = view !== "month" ? processOverlaps(filtered) : [];
    return { visibleEvents: filtered, processedEvents: processed };
  }, [allEvents, currentDate, view]);

  const getEventStyle = (ev: VisualEvent) => {
    const start = parseDate(ev.start_time);
    const end = ev.end_time
      ? parseDate(ev.end_time)
      : new Date(start.getTime() + 90 * 60000);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const offsetMinutes = START_HOUR * 60;

    const top =
      ((startMinutes - offsetMinutes) / 60) * HOUR_HEIGHT + HEADER_HEIGHT;
    const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 25)}px`,
      left: `${ev.visualLeft}%`,
      width: `${ev.visualWidth}%`,
      position: "absolute",
    } as React.CSSProperties;
  };

  const renderTimeGrid = () => {
    const daysToShow = view === "week" ? 7 : 1;
    const startDate =
      view === "week" ? getMonday(currentDate) : new Date(currentDate);

    const weekDays = Array.from({ length: daysToShow }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className={styles.timeGridContainer}>
        <div className={styles.hoursColumn}>
          {Array.from({ length: HOURS_COUNT }).map((_, i) => (
            <div
              key={i}
              className={styles.hourLabel}
              style={{ top: `${i * HOUR_HEIGHT + HEADER_HEIGHT}px` }}
            >
              {START_HOUR + i}:00
            </div>
          ))}
        </div>

        <div
          className={styles.daysWrapper}
          style={{ gridTemplateColumns: `repeat(${daysToShow}, 1fr)` }}
        >
          {weekDays.map((day, i) => (
            <div key={i} className={styles.dayColumn}>
              <div
                className={`${styles.dayHeader} ${
                  isSameDate(day, new Date()) ? styles.today : ""
                }`}
              >
                <span className={styles.dayName}>
                  {day
                    .toLocaleDateString("pl-PL", { weekday: "short" })
                    .toUpperCase()}
                </span>
                <span className={styles.dayNum}>{day.getDate()}</span>
              </div>

              {Array.from({ length: HOURS_COUNT }).map((_, h) => (
                <div
                  key={h}
                  className={styles.gridLine}
                  style={{ top: `${h * HOUR_HEIGHT + HEADER_HEIGHT}px` }}
                />
              ))}

              {processedEvents
                .filter((ev) => isSameDate(parseDate(ev.start_time), day))
                .map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.eventBlock} ${
                      styles[ev.type || "class"]
                    }`}
                    style={getEventStyle(ev)}
                    title={`${ev.title}\n${ev.room_number || ""}`}
                  >
                    <div className={styles.eventTime}>
                      {parseDate(ev.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className={styles.eventTitle}>
                      {ev.course_name?.pl}
                    </div>
                    <div className={styles.eventTypeLabel}>
                      {ev.classtype_name?.pl
                        ? ev.classtype_name.pl.slice(0, 3).toUpperCase()
                        : ev.type || "ZAJ"}
                    </div>
                    {ev.room_number && (
                      <div className={styles.eventLoc}>
                        <FaMapMarkerAlt size={10} /> {ev.room_number}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    for (let i = 0; i < startingDay; i++)
      days.push(<div key={`empty-${i}`} className={styles.monthCellEmpty} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayEvents = visibleEvents.filter((ev) =>
        isSameDate(parseDate(ev.start_time), date)
      );

      days.push(
        <div
          key={d}
          className={`${styles.monthCell} ${
            isSameDate(date, new Date()) ? styles.today : ""
          }`}
          onClick={() => onGoToDate(date, "day")}
        >
          <div className={styles.monthDate}>{d}</div>
          <div className={styles.monthEvents}>
            {dayEvents.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className={`${styles.monthDot} ${styles[ev.type || "class"]}`}
                title={ev.title}
              />
            ))}
            {dayEvents.length > 4 && (
              <span className={styles.moreEvents}>+</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.monthContainer}>
        {["PN", "WT", "ŚR", "CZ", "PT", "SO", "ND"].map((d) => (
          <div key={d} className={styles.monthHeader}>
            {d}
          </div>
        ))}
        {days}
      </div>
    );
  };

  if (loading && (!allEvents || allEvents.length === 0)) {
    return (
      <div className={styles.loader}>
        <FaSpinner className="icon-spin" /> Ładowanie planu...
      </div>
    );
  }
  if (error && (!allEvents || allEvents.length === 0)) {
    return (
      <div className={styles.error}>
        <FaExclamationTriangle /> {error}
      </div>
    );
  }

  return (
    <div className={styles.usosCalendar}>
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          {formatHeaderDate(currentDate, view)}
        </div>
        <div className={styles.controls}>
          <div className={styles.navGroup}>
            <button onClick={() => onNavigate("prev")}>
              <FaChevronLeft />
            </button>
            <button onClick={() => onGoToDate(new Date(), "day")}>Dziś</button>
            <button onClick={() => onNavigate("next")}>
              <FaChevronRight />
            </button>
          </div>
          <div className={styles.viewGroup}>
            <button
              className={view === "day" ? styles.active : ""}
              onClick={() => onViewChange("day")}
            >
              <FaCalendarDay />
            </button>
            <button
              className={view === "week" ? styles.active : ""}
              onClick={() => onViewChange("week")}
            >
              <FaCalendarWeek />
            </button>
            <button
              className={view === "month" ? styles.active : ""}
              onClick={() => onViewChange("month")}
            >
              <FaCalendarAlt />
            </button>
          </div>
        </div>
      </div>

      {Object.keys(availableLayers).length > 0 && (
        <div className={styles.layersBar}>
          {Object.values(availableLayers).map((layer) => (
            <button
              key={layer.id}
              className={`${styles.layerBadge} ${
                activeLayerIDs.has(layer.id) ? styles.activeLayer : ""
              }`}
              onClick={() => onToggleLayer(layer.id)}
              style={{ "--layer-color": layer.color } as React.CSSProperties}
            >
              {layer.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.calendarBody}>
        {view === "month" ? renderMonthGrid() : renderTimeGrid()}
      </div>
    </div>
  );
};

export default UsosCalendar;
