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
  FaGraduationCap,
  FaExclamationCircle,
  FaVolleyballBall,
  FaStickyNote,
  FaUserClock,
} from "react-icons/fa";

export type ViewType = "day" | "week" | "month";

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

const START_HOUR = 7;
const END_HOUR = 21;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;

// --- Helpery ---
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

const getEventIcon = (type: string | undefined) => {
  switch (type) {
    case "class":
    case "lecture":
    case "lab":
      return <FaGraduationCap />;
    case "exam":
    case "colloquium":
      return <FaExclamationCircle />;
    case "sport":
      return <FaVolleyballBall />;
    case "private":
      return <FaUserClock />;
    default:
      return <FaStickyNote />;
  }
};

// Helper do formatowania nagłówka daty
const formatHeaderDate = (date: Date, view: ViewType) => {
  if (view === "month") {
    return date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const start = getMonday(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    // Jeśli ten sam miesiąc
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString(
        "pl-PL",
        { month: "long" }
      )} ${start.getFullYear()}`;
    }
    // Różne miesiące
    return `${start.getDate()} ${start.toLocaleDateString("pl-PL", {
      month: "short",
    })} - ${end.getDate()} ${end.toLocaleDateString("pl-PL", {
      month: "short",
    })} ${end.getFullYear()}`;
  }
  // Dzień
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
  const visibleEvents = useMemo(() => {
    if (!allEvents) return [];

    const start =
      view === "week" ? getMonday(currentDate) : new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    if (view === "month") start.setDate(1);

    const end = new Date(start);
    if (view === "week") end.setDate(end.getDate() + 7);
    else if (view === "day") end.setDate(end.getDate() + 1);
    else end.setMonth(end.getMonth() + 1);

    return allEvents.filter((ev) => {
      const evDate = new Date(ev.start_time);
      return evDate >= start && evDate < end;
    });
  }, [allEvents, currentDate, view]);

  const getEventStyle = (ev: AppCalendarEvent) => {
    const start = new Date(ev.start_time);
    const end = ev.end_time
      ? new Date(ev.end_time)
      : new Date(start.getTime() + 90 * 60000);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = (startHour - START_HOUR) * 60 + 40;
    const height = Math.max((endHour - startHour) * 60, 40);

    return { top: `${top}px`, height: `${height}px` } as React.CSSProperties;
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
              style={{ top: `${i * 60 + 40}px` }}
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
                  style={{ top: `${h * 60 + 40}px` }}
                />
              ))}

              {visibleEvents
                .filter((ev) => isSameDate(new Date(ev.start_time), day))
                .map((ev) => (
                  <div
                    key={ev.id}
                    className={`${styles.eventBlock} ${
                      styles[ev.type || "class"]
                    }`}
                    style={getEventStyle(ev)}
                    title={`${ev.title}\n${ev.room_number}`}
                  >
                    <div className={styles.eventTime}>
                      {new Date(ev.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className={styles.eventTitle}>
                      {ev.title || ev.course_name?.pl}
                    </div>
                    <div className={styles.eventTypeLabel}>
                      {ev.classtype_name?.pl
                        ? ev.classtype_name.pl.slice(0, 3).toUpperCase()
                        : "ZAJ"}
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
    // JS getDay(): 0=Niedziela, my chcemy 0=Poniedziałek
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    for (let i = 0; i < startingDay; i++)
      days.push(<div key={`empty-${i}`} className={styles.monthCellEmpty} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayEvents = visibleEvents.filter((ev) =>
        isSameDate(new Date(ev.start_time), date)
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
          {/* Używamy nowej funkcji formatującej */}
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
