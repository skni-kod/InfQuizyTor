import type ReactGridLayout from "react-grid-layout";
import { type IconType } from "react-icons";

// Dla Gooey Menu
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
  dependencies: string[];
}

// Dla react-grid-layout
export type WidgetID = "upcoming" | "progress" | "leaderboard" | "achievements";

export interface WidgetConfig {
  id: WidgetID;
  title: string;
  component: React.ComponentType;
  defaultLayout: ReactGridLayout.Layout;
}

export interface QuizNode {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
}
export interface UpcomingEvent {
  id: string;
  type: "Wykład" | "Wejściówka" | "Spotkanie" | "Nauka" | string; // Allow custom types
  title: string;
  time: string;
  source: string; // USOS, GRUPA C-1, SEKCJA AI, PRYWATNE
  color: string; // e.g., 'var(--primary)', 'var(--error)'
}

// Type for Ranking Entry
export interface RankingEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

// Type for Learning Progress
export interface LearningProgress {
  subject: string;
  topic: string;
  progress: number; // Percentage
  required?: number; // Optional required percentage
}
export interface UsosCalendarEvent {
  id: number;
  name: { [lang: string]: string }; // e.g., { pl: "Egzamin", en: "Exam" }
  type: string; // e.g., "exam", "test", "class", "meeting"
  start_time: string; // ISO 8601 format e.g., "2025-11-15T10:00:00+01:00"
  end_time: string | null; // ISO 8601 format or null
  url?: string | null; // Optional URL related to the event
  // Add other relevant fields if needed (e.g., course_id, building_name, room_number)
}

// Type for the API response (array of events)
export type UsosCalendarResponse = UsosCalendarEvent[];
// Based on USOS API services/calendar/calendar_event and services/calendar/search
export interface UsosInstitutionCalendarEvent {
  id: number;
  name: { [lang: string]: string };
  start_date: string; // ISO 8601 format DateTime string
  end_date: string; // ISO 8601 format DateTime string
  type: string; // rector, dean, holidays, public_holidays, exam_session, etc.
  is_day_off: boolean; // True if it's a day off from classes
  faculty?: {
    // Optional faculty details
    faculty_id: string;
    // Add other faculty subfields if requested via 'fields' parameter
  } | null;
  // Add url or other fields if you include them in the 'fields' parameter
}

// Type for the API response from 'search' (list of events)
export type UsosInstitutionCalendarSearchResponse =
  UsosInstitutionCalendarEvent[];
