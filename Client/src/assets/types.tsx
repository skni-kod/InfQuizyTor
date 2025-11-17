import { IconType } from "react-icons";

// =================================================================
// 0. Typy Generyczne (Współdzielone)
// =================================================================

/**
 * Standardowa odpowiedź USOS dla pól wielojęzycznych. Pole 'en' jest
 * opcjonalne, ponieważ nie zawsze jest zwracane.
 */
export interface LangDict {
  pl: string;
  en?: string;
}

// =================================================================
// 1. Typy Aplikacji (Użytkownik, Przedmioty, AI)
// =================================================================

// --- Użytkownik ---

/**
 * Informacje o użytkowniku (z naszego API, wzorowane na USOS).
 */
export interface UsosUserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "admin";
}

// --- Ścieżka Nauki (Przedmioty, Tematy, Graf) ---

/**
 * Reprezentuje główny przedmiot w aplikacji.
 */
export interface Subject {
  id: string;
  name: string;
  icon: IconType;
  color: string;
}

/**
 * Reprezentuje pojedynczy temat/dział w ramach przedmiotu.
 */
export interface Topic {
  id: string;
  subject_id: string;
  name: string;
}

/**
 * Reprezentuje węzeł na grafie postępów w nauce.
 */
export interface QuizNode {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
  dependencies: string[]; // Lista ID węzłów, które muszą być ukończone
}

// --- Generowanie Treści (AI) ---

/**
 * Reprezentuje pojedynczą fiszkę wygenerowaną przez AI.
 */
export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

/**
 * Reprezentuje pojedyncze pytanie quizowe wygenerowane przez AI.
 */
export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Reprezentuje podsumowanie wygenerowane przez AI.
 */
export interface GeneratedSummary {
  summary: string; // Może zawierać Markdown
}

/**
 * Ogólna odpowiedź z naszego API generującego treści.
 */
export type GeminiApiResponse =
  | GeneratedFlashcard[]
  | GeneratedQuizQuestion[]
  | GeneratedSummary;

// =================================================================
// 2. Typy dla Danych z API USOS
// =================================================================

// --- Kalendarz ---

/**
 * Ujednolicony typ dla wydarzenia w kalendarzu aplikacji. Łączy dane z USOS
 * oraz wydarzenia niestandardowe z naszej bazy.
 */
export interface AppCalendarEvent {
  id: string; // ID z USOS lub z naszej bazy
  start_time: string;
  end_time?: string | null;
  layerId: string; // Klucz warstwy, np. "usos-exam", "private-1"

  // Pola niestandardowe (z naszej bazy)
  title?: string;
  description?: string;

  // Pola z USOS (mogą być puste lub null)
  name?: Partial<LangDict>; // Czasem USOS zwraca pusty obiekt {}
  url?: string | null;
  building_name?: Partial<LangDict> | null;
  room_number?: string | null;
  course_name?: Partial<LangDict> | null;
  classtype_name?: Partial<LangDict> | null;
}

/**
 * Struktura odpowiedzi z naszego API kalendarza (/api/calendar/all-events).
 */
export interface AppCalendarResponse {
  events: AppCalendarEvent[];
  layers: Record<string, { name: string; color: string }>;
}

/**
 * Wydarzenie z kalendarza instytucji (np. dni wolne, sesje). Endpoint:
 * services/calendar/search
 */
export interface UsosInstitutionCalendarEvent {
  id: number;
  name: LangDict;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  type: string; // np. rector, dean, holidays, exam_session
  is_day_off: boolean;
  faculty?: {
    faculty_id: string;
  } | null;
}

// --- Oceny ---

/**
 * Reprezentuje pojedynczą, ostatnio dodaną ocenę. Endpoint:
 * services/grades/latest
 */
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

/**
 * Reprezentuje semestr akademicki.
 */
export interface UsosTerm {
  id: string;
  name: LangDict;
}

/**
 * Reprezentuje jedną edycję kursu (przedmiot w danym semestrze). Endpoint:
 * services/courses/user
 */
export interface UsosCourseEdition {
  course_id: string;
  course_name: LangDict;
  term_id: string;
  profile_url: string | null;
  passing_status: "passed" | "failed" | "not_yet_passed" | string;
}

/**
 * Odpowiedź z endpointu 'services/courses/user'.
 */
export interface UsosUserCoursesResponse {
  terms: UsosTerm[];
  course_editions: Record<string, UsosCourseEdition[]>;
}

// --- Sprawdziany (Drzewa Ocen) ---

/**
 * Reprezentuje główny węzeł sprawdzianu (testu). Endpoint:
 * services/crstests/participant
 */
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

/**
 * Odpowiedź z endpointu 'services/crstests/participant'.
 */
export interface UsosParticipantTestsResponse {
  tests: Record<string, UsosTestRoot[]>;
  terms: Record<string, UsosTerm>;
}

// --- Legitymacje i Karty ---

/**
 * Reprezentuje legitymację lub kartę użytkownika. Endpoint: services/cards/user
 */
export interface UsosCard {
  id: string;
  type: "student" | "phd" | "staff" | "graduate" | "academic_teacher" | string;
  barcode_number: string | null;
  student_number: string | null;
  expiration_date: string | null;
  date_of_issue: string | null;
}

// --- Grupy Niestandardowe ---

/**
 * Reprezentuje grupę zajęciową (np. wykład, ćwiczenia).
 */
export interface UsosPrimaryGroup {
  group_id: string;
  name: LangDict;
}

/**
 * Reprezentuje prostą grupę niestandardową (używane w zagnieżdżeniach).
 */
export interface UsosSimpleCustomGroup {
  id: string;
  name: string;
}

/**
 * Pełna definicja grupy niestandardowej. Endpoint: services/csgroups/user
 */
export interface UsosCustomGroup {
  id: string;
  name: string;
  primary_groups?: UsosPrimaryGroup[];
  custom_groups?: UsosSimpleCustomGroup[];
  users?: UsosUserInfo[];
  emails?: string[];
}

// --- Budynki (Geo) ---

/**
 * Reprezentuje współrzędne geograficzne.
 */
export interface UsosBuildingLocation {
  long: number;
  lat: number;
}

/**
 * Reprezentuje adresy URL zdjęć budynku.
 */
export interface UsosBuildingPhotoUrls {
  screen: string | null;
}

/**
 * Reprezentuje budynek uczelni. Endpoint: services/geo/building_index
 */
export interface UsosBuilding {
  id: string;
  name: LangDict;
  postal_address: string | null;
  location: UsosBuildingLocation | null;
  photo_urls: UsosBuildingPhotoUrls | null;
}

// =================================================================
// 3. Typy dla Mockowych Danych (Dashboard)
// =================================================================

/**
 * Mockowy typ dla nadchodzących wydarzeń na pulpicie.
 */
export interface UpcomingEvent {
  id: string;
  type: string;
  title: string;
  time: string;
  source: string;
  color: string;
}

/**
 * Mockowy typ dla wpisu w rankingu na pulpicie.
 */
export interface RankingEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

/**
 * Mockowy typ dla postępów w nauce na pulpicie.
 */
export interface LearningProgress {
  subject: string;
  topic: string;
  progress: number;
  required?: number;
}
