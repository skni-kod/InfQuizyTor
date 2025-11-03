import { IconType } from "react-icons";
import ReactGridLayout from "react-grid-layout"; // Import typu z RGL

// 1. Typy dla Menu (Przedmioty i Quizy)

export interface Subject {
  id: string;
  name: string;
  icon: IconType;
  color: string; // np. 'var(--primary)', 'var(--success)'
}

export interface QuizNode {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
  dependencies: string[]; // Lista ID węzłów, które muszą być ukończone
}

// 2. Typy dla Kalendarza (na podstawie services/calendar/user_events)

export interface UsosCalendarEvent {
  id: number;
  name: { [lang: string]: string }; // np. { pl: "Egzamin", en: "Exam" }
  type: string; // np. "exam", "test", "class", "meeting"
  start_time: string; // ISO 8601 e.g., "2025-11-15T10:00:00+01:00"
  end_time: string | null;
  url?: string | null;
}

export type UsosCalendarResponse = UsosCalendarEvent[];

// 3. Typy dla Kalendarza Instytucji (na podstawie services/calendar/search)

export interface UsosInstitutionCalendarEvent {
  id: number;
  name: { [lang: string]: string };
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  type: string; // rector, dean, holidays, exam_session, etc.
  is_day_off: boolean;
  faculty?: {
    faculty_id: string;
  } | null;
}

export type UsosInstitutionCalendarSearchResponse =
  UsosInstitutionCalendarEvent[];

// 4. Typy dla Widgetów

export type WidgetID = "upcoming" | "progress" | "leaderboard" | "achievements";

export interface WidgetConfig {
  id: WidgetID;
  title: string;
  component: React.ComponentType;
  defaultLayout: ReactGridLayout.Layout; // Użyj typu z RGL
}

// 5. Typy dla Użytkownika (z services/users/user) - BRAKUJĄCY TYP

export interface UsosUserInfo {
  id: string;
  first_name: string; // Dopasowane do pól JSON (first_name)
  last_name: string; // Dopasowane do pól JSON (last_name)
  email: string; // Dopasowane do pól JSON (email)
  // Pole 'name' (LangDict) zostało celowo usunięte, ponieważ powodowało błąd API 400
}

// 6. Typy dla Danych Mockowych (Hex Layout)

export interface UpcomingEvent {
  id: string;
  type: "Wykład" | "Wejściówka" | "Spotkanie" | "Nauka" | string;
  title: string;
  time: string;
  source: string;
  color: string;
}

export interface RankingEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface LearningProgress {
  subject: string;
  topic: string;
  progress: number;
  required?: number;
}
