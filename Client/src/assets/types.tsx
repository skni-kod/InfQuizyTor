import { IconType } from "react-icons";

// =================================================================
// 0. Typy Generyczne (Współdzielone)
// =================================================================

export interface LangDict {
  pl: string;
  en?: string;
}

// =================================================================
// 1. Typy Aplikacji (Użytkownik, AI, Mock Data)
// =================================================================

// --- Użytkownik ---
export interface UsosUserInfo {
  id: string; // To jest UsosID
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "admin";
}

// --- Generowanie Treści (AI) ---
export interface GeneratedFlashcard {
  question: string;
  answer: string;
}
export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}
export interface GeneratedSummary {
  summary: string;
}
export type GeminiApiResponse =
  | GeneratedFlashcard[]
  | GeneratedQuizQuestion[]
  | GeneratedSummary;

// --- Mockowe Dane (Dashboard) ---
export interface UpcomingEvent {
  id: string;
  type: string;
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

// =================================================================
// 2. Typy Ścieżki Nauki (Nasza Baza Danych i Frontend)
// =================================================================

/**
 * Typ `Subject` zwracany przez nasze API (np. /api/subjects/:id).
 * Pasuje do `models.Subject` z Go.
 */
export interface Subject {
  ID: number; // ID z naszej bazy (Primary Key)
  UsosID: string;
  Name: string;
}

/**
 * Typ `Subject` używany w aplikacji (np. w Menu).
 * Łączy dane z API z danymi frontendu (ikona, kolor).
 */
export interface AppSubject {
  id: string; // Używamy UsosID jako głównego identyfikatora na frontendzie
  UsosID: string; // Wymagane przez QuizGraph i dla spójności
  db_id: number; // ID z naszej bazy danych (pasuje do Subject.ID)
  name: string;
  term_id: string;
  icon: IconType;
  color: string;
}

/**
 * Reprezentuje pojedynczy temat/dział w ramach przedmiotu.
 * Pasuje do `models.Topic` z Go.
 */
export interface Topic {
  ID: number;
  SubjectID: number;
  Name: string;
  CourseUsosID?: string; // Ważne dla mapowania w Menu.tsx
  CreatedByUsosID: string;
}

/**
 * Reprezentuje węzeł na grafie postępów w nauce.
 * POWINIEN pasować do modelu `models.QuizNode` (lub podobnego) z backendu Go.
 */
export interface QuizNode {
  ID: number; // ID węzła z bazy danych
  UsosCourseID: string; // Do którego kursu należy
  Title: string; // Nazwa wyświetlana
  // Zależności są teraz liczbami (ID innych QuizNode)
  Dependencies: number[];
}

// =================================================================
// 3. Typy dla Danych z API USOS
// =================================================================

// --- Kalendarz ---
export interface AppCalendarEvent {
  id: string;
  start_time: string;
  end_time?: string | null;
  layerId: string;
  title?: string;
  description?: string;
  name?: Partial<LangDict>;
  url?: string | null;
  building_name?: Partial<LangDict> | null;
  room_number?: string | null;
  course_name?: Partial<LangDict> | null;
  classtype_name?: Partial<LangDict> | null;
}
export interface AppCalendarResponse {
  events: AppCalendarEvent[];
  layers: Record<string, { name: string; color: string }>;
}

// --- Oceny ---
export interface UsosLatestGrade {
  value_symbol: string;
  value_description: LangDict;
  date_modified: string;
  exam_id: string;
  exam_session_number: number;
  course_edition: {
    course_name: LangDict;
  };
}

// --- Przedmioty i Semestry ---
export interface UsosTerm {
  id: string;
  name: LangDict;
}
export interface UsosCourseEdition {
  course_id: string;
  course_name: LangDict;
  term_id: string;
  profile_url: string | null;
  passing_status: string;
}
export interface UsosUserCoursesResponse {
  terms: UsosTerm[];
  course_editions: Record<string, UsosCourseEdition[]>;
}

// --- Sprawdziany (Drzewa Ocen) ---
export interface UsosTestRoot {
  node_id: string;
  name: LangDict;
  description: LangDict;
  visible_for_students: boolean;
  course_edition: {
    course_id: string;
    course_name: LangDict;
    term_id: string;
    profile_url: string | null;
  } | null;
}
export interface UsosParticipantTestsResponse {
  tests: Record<string, UsosTestRoot[]>;
  terms: Record<string, UsosTerm>;
}

// --- Inne typy USOS ---
export interface UsosCard {
  /* ... */
}
// ... (reszta typów USOS)
