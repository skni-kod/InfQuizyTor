import { QuizNode, Topic } from "../../assets/types.tsx"; // Załóżmy, że ścieżka jest poprawna

// Mapa tematów (Topic) używana do obsługi kliknięć
// Musi zawierać WPIS DLA KAŻDEGO 'title' z MOCK_GRAPH
export const MOCK_TOPIC_MAP: { [key: string]: Topic } = {
  "Podstawy Równań": { id: "t1", subject_id: "s1", name: "Podstawy Równań" },
  "Pochodne Cząstkowe": {
    id: "t2",
    subject_id: "s1",
    name: "Pochodne Cząstkowe",
  },
  "Całki Wielokrotne": {
    id: "t3",
    subject_id: "s1",
    name: "Całki Wielokrotne",
  },
  "Całki Krzywoliniowe": {
    id: "t4",
    subject_id: "s1",
    name: "Całki Krzywoliniowe",
  },
  "Twierdzenie Greena": {
    id: "t5",
    subject_id: "s1",
    name: "Twierdzenie Greena",
  },
  "Twierdzenie Stokesa": {
    id: "t6",
    subject_id: "s1",
    name: "Twierdzenie Stokesa",
  },
  "Ekstrema Funkcji Wielu Zmiennych": {
    id: "t7",
    subject_id: "s1",
    name: "Ekstrema Funkcji Wielu Zmiennych",
  },
  "Mnożniki Lagrange'a": {
    id: "t8",
    subject_id: "s1",
    name: "Mnożniki Lagrange'a",
  },
  "Szeregi Liczbowe": { id: "t9", subject_id: "s1", name: "Szeregi Liczbowe" },
  "Kryteria Zbieżności": {
    id: "t10",
    subject_id: "s1",
    name: "Kryteria Zbieżności",
  },
  "Szeregi Potęgowe": { id: "t11", subject_id: "s1", name: "Szeregi Potęgowe" },
  "Rozwinięcie Taylora": {
    id: "t12",
    subject_id: "s1",
    name: "Rozwinięcie Taylora",
  },
  "Całki Powierzchniowe": {
    id: "t13",
    subject_id: "s1",
    name: "Całki Powierzchniowe",
  },
  "Twierdzenie Gaussa-Ostrogradskiego": {
    id: "t14",
    subject_id: "s1",
    name: "Twierdzenie Gaussa-Ostrogradskiego",
  },
  "Podstawy Prawdopodobieństwa": {
    id: "p1",
    subject_id: "s1",
    name: "Podstawy Prawdopodobieństwa",
  },
  "Zmienne Losowe": { id: "p2", subject_id: "s1", name: "Zmienne Losowe" },
  "Rozkład Normalny": { id: "p3", subject_id: "s1", name: "Rozkład Normalny" },
};

// Dane definiujące strukturę grafu
export const MOCK_GRAPH: QuizNode[] = [
  // Core Path 1
  { id: "q1", title: "Podstawy Równań", status: "completed", dependencies: [] },
  {
    id: "q2",
    title: "Pochodne Cząstkowe",
    status: "completed",
    dependencies: ["q1"],
  },
  {
    id: "q3",
    title: "Całki Wielokrotne",
    status: "available",
    dependencies: ["q2"],
  },
  {
    id: "q4",
    title: "Całki Krzywoliniowe",
    status: "available",
    dependencies: ["q3"],
  },
  {
    id: "q5",
    title: "Twierdzenie Greena",
    status: "locked",
    dependencies: ["q4"],
  },
  {
    id: "q6",
    title: "Twierdzenie Stokesa",
    status: "locked",
    dependencies: ["q5"],
  },

  // Branch 1 from Pochodne
  {
    id: "q7",
    title: "Ekstrema Funkcji Wielu Zmiennych",
    status: "available",
    dependencies: ["q2"],
  },
  {
    id: "q8",
    title: "Mnożniki Lagrange'a",
    status: "locked",
    dependencies: ["q7"],
  },

  // Branch 2 from Podstawy (Independent Path)
  {
    id: "q9",
    title: "Szeregi Liczbowe",
    status: "completed",
    dependencies: ["q1"],
  },
  {
    id: "q10",
    title: "Kryteria Zbieżności",
    status: "completed",
    dependencies: ["q9"],
  },
  {
    id: "q11",
    title: "Szeregi Potęgowe",
    status: "available",
    dependencies: ["q10"],
  },
  {
    id: "q12",
    title: "Rozwinięcie Taylora",
    status: "locked",
    dependencies: ["q11"],
  },

  // Deeper Branch from Całki
  {
    id: "q13",
    title: "Całki Powierzchniowe",
    status: "locked",
    dependencies: ["q4"],
  }, // Depends on Krzywoliniowe
  {
    id: "q14",
    title: "Twierdzenie Gaussa-Ostrogradskiego",
    status: "locked",
    dependencies: ["q13", "q6"],
  }, // Depends on 2 paths

  // Another Root Node Path (Example: Probability)
  {
    id: "p1",
    title: "Podstawy Prawdopodobieństwa",
    status: "completed",
    dependencies: [],
  },
  {
    id: "p2",
    title: "Zmienne Losowe",
    status: "available",
    dependencies: ["p1"],
  },
  {
    id: "p3",
    title: "Rozkład Normalny",
    status: "locked",
    dependencies: ["p2"],
  },
];
