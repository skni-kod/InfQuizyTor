import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import styles from "./Menu.module.scss";

import { AppSubject, Topic, Subject } from "../../assets/types.tsx";
import QuizGraph from "../Quiz/QuizGraph";

import {
  FaUserCircle,
  FaCalculator,
  FaDatabase,
  FaCode,
  FaNetworkWired,
  FaAtom,
  FaMicrochip,
  FaBookOpen,
  FaSpinner,
  FaQuestion,
  FaTimes,
} from "react-icons/fa";
import { IconType } from "react-icons";

// --- LOGIKA WIZUALNA ---
const SUBJECT_VISUALS: Record<string, { icon: IconType; color: string }> = {
  "Analiza matematyczna i algebra liniowa": {
    icon: FaCalculator,
    color: "var(--primary)",
  },
  "Wstęp do programowania": { icon: FaCode, color: "var(--info)" },
  "Wychowanie fizyczne cz.1": { icon: FaBookOpen, color: "var(--tertiary)" },
  "Technika informacyjno-pomiarowa": {
    icon: FaMicrochip,
    color: "var(--success)",
  },
  "Sygnały i systemy": { icon: FaNetworkWired, color: "hsl(30, 70%, 55%)" },
  "Programowanie w języku C": { icon: FaCode, color: "var(--info)" },
  "Narzędzia dla programistów": { icon: FaMicrochip, color: "var(--warning)" },
  "Logika i teoria mnogości": { icon: FaBookOpen, color: "hsl(60, 70%, 55%)" },
  "Języki, automaty i obliczenia": {
    icon: FaBookOpen,
    color: "hsl(280, 70%, 55%)",
  },
  "Bazy Danych": { icon: FaDatabase, color: "var(--success)" },
  "Systemy Operacyjne": { icon: FaMicrochip, color: "var(--info)" },
  "Fizyka I": { icon: FaAtom, color: "hsl(280, 70%, 55%)" },
  default: { icon: FaQuestion, color: "var(--tertiary)" },
};

const mapDbSubjectsToAppSubjects = (dbSubjects: Subject[]): AppSubject[] => {
  return dbSubjects.map((subject) => {
    const name = subject.Name || "default";
    const visuals = SUBJECT_VISUALS[name] || SUBJECT_VISUALS["default"];
    return {
      id: subject.UsosID,
      UsosID: subject.UsosID,
      term_id: (subject as any).term_id || "2024L",
      db_id: subject.ID,
      name: name,
      icon: visuals.icon,
      color: visuals.color,
    };
  });
};

// Generuje gradient dla bordera
// Funkcja pomocnicza (upewnij się, że masz taką logikę)
const getGradientString = (colors: string[]) => {
  if (colors.length === 0)
    return "conic-gradient(var(--primary), var(--primary))";

  // Jeśli jest tylko jeden kolor (np. Level 2 - konkretny przedmiot),
  // tworzymy gradient z tego samego koloru do tego samego koloru (jednolite tło/ramka)
  if (colors.length === 1) {
    return `conic-gradient(${colors[0]}, ${colors[0]})`;
  }

  const segmentSize = 100 / colors.length;
  let gradientParts = [];
  for (let i = 0; i < colors.length; i++) {
    const start = i * segmentSize;
    // Dodajemy 'hard stop' albo miękkie przejście. Tutaj miękkie (środek segmentu).
    gradientParts.push(`${colors[i]} ${start + segmentSize / 2}%`);
  }
  // Zamykamy pętlę
  gradientParts.push(`${colors[0]} 100%`);

  return `conic-gradient(from 0deg, ${gradientParts.join(", ")})`;
};

type MenuLevel = 0 | 1 | 2;
type LoadingState = "idle" | "loading" | "error";

const Menu = () => {
  const { isMenuOpen, setIsMenuOpen } = useAppContext();
  const [level, setLevel] = useState<MenuLevel>(0);
  const [activeSubject, setActiveSubject] = useState<AppSubject | null>(null);
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<AppSubject[]>([]);
  const [subjectsLoadingState, setSubjectsLoadingState] =
    useState<LoadingState>("idle");
  const [topicsLoadingState, setTopicsLoadingState] =
    useState<LoadingState>("idle");
  const [topics, setTopics] = useState<Topic[]>([]);

  const isLoading =
    subjectsLoadingState === "loading" || topicsLoadingState === "loading";

  // --- OPTYMALIZACJA: Wstępne pobieranie danych ---
  // Pobieramy przedmioty od razu po załadowaniu komponentu, żeby nie czekać przy kliknięciu
  useEffect(() => {
    const fetchInitialData = async () => {
      if (subjects.length > 0) return; // Już mamy dane

      setSubjectsLoadingState("loading");
      try {
        try {
          await fetch("/api/subjects/sync", {
            method: "POST",
            credentials: "include",
          });
        } catch (e) {}
        const getRes = await fetch("/api/subjects", { credentials: "include" });
        if (!getRes.ok) throw new Error("Błąd pobierania");
        const dbData: Subject[] = await getRes.json();
        setSubjects(mapDbSubjectsToAppSubjects(dbData));
        setSubjectsLoadingState("idle");
      } catch (e) {
        console.error(e);
        setSubjectsLoadingState("error");
      }
    };

    fetchInitialData();
  }, []);

  const fetchTopics = async (subject: AppSubject) => {
    setTopicsLoadingState("loading");
    setTopics([]);
    try {
      const res = await fetch(`/api/subjects/${subject.UsosID}/topics`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Błąd");
      const data: Topic[] = await res.json();
      setTopics(data);
      setTopicsLoadingState("idle");
    } catch (e) {
      console.error(e);
      setTopicsLoadingState("error");
    }
  };

  const openLevel1 = () => {
    setLevel(1);
    setIsMenuOpen(true);
    setActiveSubject(null);
    // Dane są już pobierane w useEffect, więc nie musimy tu czekać
  };

  const openLevel2 = (subject: AppSubject) => {
    setLevel(2);
    setActiveSubject(subject);
    setIsMenuOpen(true);
    fetchTopics(subject);
  };

  const backToLevel1 = () => {
    setLevel(1);
    setActiveSubject(null);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setLevel(0);
    setActiveSubject(null);
    setIsMenuOpen(false);
  };

  const handleCentralClick = () => {
    if (level === 0) openLevel1();
    else if (level === 1) closeMenu();
    else if (level === 2) backToLevel1();
  };

  const handleGraphNodeClick = (topic: Topic) => {
    if (activeSubject) {
      navigate(`/quiz/${activeSubject.UsosID}/${topic.ID}`);
      closeMenu();
    }
  };

  useEffect(() => {
    if (!isMenuOpen && level !== 0) {
      setLevel(0);
      setActiveSubject(null);
    }
  }, [isMenuOpen, level]);

  const getRadialPosition = (index: number, count: number, radius: number) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  // Dynamiczne zmienne
  let CentralIcon = FaUserCircle;
  if (level === 1) CentralIcon = FaTimes;
  if (level === 2 && activeSubject) CentralIcon = activeSubject.icon;

  const centralNodeColor =
    level === 2 && activeSubject ? activeSubject.color : "var(--primary)";
  const nodeRadius = 220;

  // Obliczanie kolorów do gradientu
  const currentColors = useMemo(() => {
    if (level === 1) return subjects.map((s) => s.color);
    if (level === 2 && activeSubject) return [activeSubject.color];
    return ["var(--primary)"];
  }, [level, subjects, activeSubject]);

  const borderGradient = getGradientString(currentColors);

  return (
    <div className={styles.gooeyContainer}>
      <div className={`${styles.menu} ${level > 0 ? styles.isExpanded : ""}`}>
        {/* --- CENTRALNY PRZYCISK --- */}
        <button
          className={`${styles.node} ${styles.profileNode}`}
          onClick={handleCentralClick}
          style={
            {
              "--node-color": centralNodeColor,
              "--border-gradient": borderGradient,
            } as React.CSSProperties
          }
        >
          <CentralIcon />
          <span className={styles.centralLabel}>
            {level === 0 && "Profil"}
            {level === 1 && "Zamknij"}
            {level === 2 && "Wróć"}
          </span>
        </button>

        {isLoading && (
          <div className={styles.loaderOverlay}>
            <FaSpinner className="icon-spin" />
          </div>
        )}
        {subjectsLoadingState === "error" && level === 1 && (
          <div className={styles.errorNode}>Błąd sieci</div>
        )}

        {/* --- POZIOM 1: Przedmioty --- */}
        {subjects.map((subject, i) => {
          const { x, y } = getRadialPosition(i, subjects.length, nodeRadius);
          const isVisible = level === 1;

          return (
            <button
              key={subject.id}
              className={`${styles.node} ${styles.subjectNode}`}
              onClick={() => openLevel2(subject)}
              disabled={!isVisible}
              style={
                {
                  "--node-color": subject.color,
                  // Używamy transformacji do pozycji. Jeśli ukryty -> wraca do środka.
                  transform: isVisible
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : `translate(0px, 0px) scale(0)`,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? "auto" : "none",
                  // Lepsze opóźnienie dla płynności (szybciej)
                  transitionDelay: isVisible ? `${i * 0.03}s` : "0s",
                  zIndex: 5,
                } as React.CSSProperties
              }
            >
              <div className={styles.iconWrapper}>
                <subject.icon />
              </div>
              <span>{subject.name}</span>
            </button>
          );
        })}

        {/* --- POZIOM 2: Graf Quizu --- */}
        {level === 2 && activeSubject && topicsLoadingState !== "loading" && (
          <QuizGraph
            subject={{
              ID: activeSubject.db_id,
              UsosID: activeSubject.UsosID,
              Name: activeSubject.name,
            }}
            UsosID={activeSubject.UsosID}
            topics={topics}
            onNodeClick={handleGraphNodeClick}
            onBack={backToLevel1}
            subjectColor={activeSubject.color}
          />
        )}
      </div>
    </div>
  );
};

export default Menu;
