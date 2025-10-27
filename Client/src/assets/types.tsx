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
