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

export interface UsosUserInfo {
  id: string;
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

// --- Dashboard Widgets ---
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
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_code: string;
  unlocked_at: string;
}

// =================================================================
// 2. Typy Ścieżki Nauki
// =================================================================

export interface Subject {
  ID: number;
  UsosID: string;
  Name: string;
}

export interface AppSubject {
  id: string;
  UsosID: string;
  db_id: number;
  name: string;
  term_id: string;
  icon: IconType;
  color: string;
}

export interface Topic {
  ID: number;
  SubjectID: number;
  Name: string;
  CourseUsosID?: string;
  CreatedByUsosID: string;
}

export interface QuizNode {
  ID: number;
  UsosCourseID: string;
  Title: string;
  Dependencies: number[];
}

// =================================================================
// 3. Typy dla Danych z API USOS (NAPRAWIONE)
// =================================================================

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

// --- <NAPRAWIONO> Dodano brakujące typy dla UserCoursesWidget ---
export interface UsosTerm {
  id: string;
  name: LangDict;
  start_date: string;
  end_date: string;
}

export interface UsosCourseEdition {
  course_id: string;
  course_name: LangDict;
  term_id: string;
  profile_url: string | null;
  passing_status: string;
}

export interface UsosUserCoursesResponse {
  // USOS API (services/courses/user) zwraca słownik course_editions
  terms: UsosTerm[];
  course_editions: Record<string, UsosCourseEdition[]>;
}
// --- </NAPRAWIONO> ---

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

// =================================================================
// 0. Typy Generyczne (Współdzielone)
// =================================================================

export interface LangDict {
  pl: string;
  en?: string;
}

// =================================================================
// 1. Typy Aplikacji (Użytkownik, AI)
// =================================================================

export interface UsosUserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "admin";
}

// =================================================================
// 2. Typy Ścieżki Nauki
// =================================================================

export interface Subject {
  ID: number;
  UsosID: string;
  Name: string;
}

export interface AppSubject {
  id: string;
  UsosID: string;
  db_id: number;
  name: string;
  term_id: string;
  icon: IconType;
  color: string;
}

export interface Topic {
  ID: number;
  SubjectID: number;
  Name: string;
  CourseUsosID?: string;
  CreatedByUsosID: string;
}

export interface QuizNode {
  ID: number;
  UsosCourseID: string;
  Title: string;
  Dependencies: number[];
}

// =================================================================
// 3. Typy dla Danych z API USOS
// =================================================================

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

// --- Przedmioty ---
export interface UsosTerm {
  id: string;
  name: LangDict;
  start_date: string;
  end_date: string;
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

// --- Sprawdziany ---
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

// --- Karty/Legitymacje ---
export interface UsosCard {
  id: string;
  type: string; // 'student', 'phd', 'staff' etc.
  barcode_number?: string;
  student_number?: string;
  expiration_date?: string;
  date_of_issue?: string;
}

// --- Grupy Niestandardowe ---
export interface UsosCustomGroup {
  id: string;
  name: string;
  // member_count nie jest dostępne w prostym widoku user
}

// --- Budynki (Geo) ---
export interface UsosBuilding {
  id: string;
  name: LangDict;
  postal_address: string;
  location?: {
    lat: number;
    long: number;
  };
  photo_urls?: {
    screen?: string;
    thumbnail?: string;
  };
}

// --- Treści AI ---
export interface GeneratedFlashcard {
  Question: string;
  Answer: string;
}
export interface GeneratedQuizQuestion {
  Question: string;
  Options: string[];
  CorrectIndex: number;
}
export interface GeneratedSummary {
  summary: string;
}
