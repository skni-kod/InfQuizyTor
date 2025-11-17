import { IconType } from "react-icons";
import ReactGridLayout from "react-grid-layout"; // Import typu z RGL

// =================================================================
// 0. Typy Generyczne (Współdzielone)
// =================================================================

/**
 * Standardowa odpowiedź USOS dla pól wielojęzycznych.
 */
export interface LangDict {
  pl: string;
  en: string;
}

// =================================================================
// 1. Typy dla Menu (Przedmioty i Quizy)
// =================================================================

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

// =================================================================
// 2. Typy dla Danych USOS
// =================================================================

/**
 * Kalendarz osobisty użytkownika (z services/tt/user)
 * To jest POPRAWNA, zaktualizowana definicja.
 */
export interface UsosCalendarEvent {
  type: string;
  start_time: string;
  end_time: string | null;
  name: LangDict;
  url: string | null;

  // --- DODANE OPCJONALNE POLA (zgodnie z poprzednią poprawką) ---
  course_name?: LangDict;
  classtype_name?: LangDict;
  building_name?: LangDict;
  room_number?: string;
  lecturer_ids?: number[];
}

export type UsosCalendarResponse = UsosCalendarEvent[];

/**
 * Kalendarz instytucji (z services/calendar/search)
 */
export interface UsosInstitutionCalendarEvent {
  id: number;
  name: LangDict; // Używamy LangDict
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

/**
 * Informacje o użytkowniku (z services/users/user)
 */
export interface UsosUserInfo {
  id?: string; // Ustawiamy jako opcjonalne
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Oceny (z services/grades/user)
 */
export interface UsosGrade {
  course_id: string;
  course_name: LangDict; // Używamy LangDict
  term_id: string;
  value_symbol: string; // Np. "5.0"
  value_description: LangDict; // Używamy LangDict
}

/**
 * Sprawdziany (z services/crstests/user_tests)
 */
export interface UsosTest {
  course_id: string;
  course_name: LangDict; // Używamy LangDict
  name: string; // Nazwa sprawdzianu
  start_time: string;
  end_time: string;
  result?: string; // Może być opcjonalne
  url: string;
}

// =================================================================
// 3. Typy dla Widgetów
// =================================================================

export type WidgetID = "upcoming" | "progress" | "leaderboard" | "achievements";

export interface WidgetConfig {
  id: WidgetID;
  title: string;
  component: React.ComponentType;
  defaultLayout: ReactGridLayout.Layout; // Użyj typu z RGL
}

// =================================================================
// 4. Typy dla Danych Mockowych (Hex Layout)
// =================================================================

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
export interface UsosCard {
  id: string;
  type: "student" | "phd" | "staff" | "graduate" | "academic_teacher" | string;
  barcode_number: string | null;
  student_number: string | null;
  expiration_date: string | null; // Data ISO, np. "2025-10-31"
  date_of_issue: string | null; // Data ISO
}
export interface UsosTerm {
  id: string;
  name: LangDict;
  // (API 'terms/term' zwraca więcej pól, ale 'courses/user' jest ograniczone)
}

/**
 * Reprezentuje jedną edycję kursu (przedmiot w semestrze)
 * (na podstawie pól z 'services/courses/course_edition')
 */
export interface UsosCourseEdition {
  course_id: string;
  course_name: LangDict;
  term_id: string;
  profile_url: string | null;
  passing_status: "passed" | "failed" | "not_yet_passed" | string;
}

/**
 * Odpowiedź z endpointu 'services/courses/user'
 */
export interface UsosUserCoursesResponse {
  terms: UsosTerm[];
  course_editions: {
    [term_id: string]: UsosCourseEdition[];
  };
}
export interface UsosTestRoot {
  node_id: string;
  name: LangDict;
  description: LangDict;
  visible_for_students: boolean;
  course_edition: {
    // Obiekt z informacjami o przedmiocie
    course_id: string;
    course_name: LangDict;
    term_id: string;
    profile_url: string | null;
  } | null; // Może być nullem, jeśli to szablon
}

/**
 * Odpowiedź z endpointu 'services/crstests/participant'
 */
export interface UsosParticipantTestsResponse {
  // UWAGA: API zwraca obiekty (mapy), a nie tablice
  tests: {
    [term_id: string]: UsosTestRoot[]; // Mapa [ID semestru] -> [Lista testów]
  };
  terms: {
    [term_id: string]: UsosTerm; // Mapa [ID semestru] -> [Obiekt Semestru]
  };
}
export interface UsosLatestGrade {
  value_symbol: string; // Np. "5.0"
  value_description: LangDict; // Np. { pl: "bardzo dobry" }
  date_modified: string; // Data ostatniej modyfikacji
  exam_id: string; // ID egzaminu/protokołu
  exam_session_number: number; // Numer terminu

  // Zagnieżdżony obiekt z informacją o przedmiocie
  course_edition: {
    course_name: LangDict;
  };
}
export interface UsosPrimaryGroup {
  group_id: string; // (Prawdopodobnie ID grupy)
  name: LangDict;
}

/**
 * Reprezentuje prostą grupę niestandardową (dla list zagnieżdżonych)
 */
export interface UsosSimpleCustomGroup {
  id: string;
  name: string;
}

/**
 * Pełna definicja Grupy Niestandardowej (z services/csgroups/user)
 */
export interface UsosCustomGroup {
  id: string;
  name: string;

  // Pola drugorzędne (zawartość grupy)
  primary_groups?: UsosPrimaryGroup[];
  custom_groups?: UsosSimpleCustomGroup[];
  users?: UsosUserInfo[]; // Używamy ponownie typu UsosUserInfo
  emails?: string[];
}
/**
 * Reprezentuje współrzędne geograficzne (z services/geo/building2)
 */
export interface UsosBuildingLocation {
  long: number;
  lat: number;
}

/**
 * Reprezentuje adresy URL zdjęć budynku (z services/geo/building2)
 */
export interface UsosBuildingPhotoUrls {
  screen: string | null; // Zakładamy, że prosimy o 'screen'
}

/**
 * Reprezentuje budynek (z services/geo/building_index)
 */
export interface UsosBuilding {
  id: string;
  name: LangDict;
  postal_address: string | null;
  location: UsosBuildingLocation | null;
  photo_urls: UsosBuildingPhotoUrls | null;
}
/**
 * Reprezentuje pojedynczą fiszkę wygenerowaną przez AI
 */
export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

/**
 * Reprezentuje pojedyncze pytanie quizowe wygenerowane przez AI
 */
export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Reprezentuje podsumowanie wygenerowane przez AI
 */
export interface GeneratedSummary {
  summary: string; // Zwykły tekst lub Markdown
}

/**
 * Ogólna odpowiedź z naszego API generującego
 */
export type GeminiApiResponse =
  | GeneratedFlashcard[]
  | GeneratedQuizQuestion[]
  | GeneratedSummary;
