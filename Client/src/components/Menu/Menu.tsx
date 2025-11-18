import React, { useState, useEffect } from "react";
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
  const [rotation, setRotation] = useState(0);

  const isLoading =
    subjectsLoadingState === "loading" || topicsLoadingState === "loading";

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setRotation((prev) => (prev + 0.5) % 360); // Wolniejszy obrót
      frameId = requestAnimationFrame(animate);
    };
    if (isMenuOpen) {
      frameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isMenuOpen]);

  const syncAndFetchSubjects = async () => {
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
    if (subjects.length === 0) syncAndFetchSubjects();
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

  let CentralIcon = FaUserCircle;
  if (level === 1) CentralIcon = FaTimes;
  if (level === 2 && activeSubject) CentralIcon = activeSubject.icon;

  const centralNodeColor =
    level === 2 && activeSubject ? activeSubject.color : "var(--primary)";
  const nodeRadius = 220;

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
              "--angle": `${rotation}deg`,
            } as React.CSSProperties
          }
        >
          <div className={styles.centralIconWrapper}>
            <CentralIcon />
          </div>
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
        {/* UWAGA: Usunięto warunek {level === 1 && ...}. Mapujemy zawsze, jeśli są dane. */}
        {subjectsLoadingState !== "loading" &&
          subjects.map((subject, i) => {
            const { x, y } = getRadialPosition(i, subjects.length, nodeRadius);

            // Sterujemy widocznością tylko za pomocą flagi
            const isVisible = level === 1;

            return (
              <button
                key={subject.id}
                className={`${styles.node} ${styles.subjectNode}`}
                onClick={() => openLevel2(subject)}
                // Jeśli nie jest widoczny (Level 0 lub Level 2), blokujemy kliknięcia CSS-em (pointer-events)
                disabled={!isVisible}
                style={
                  {
                    "--node-color": subject.color,
                    // Jeśli widoczne: idź na pozycję. Jeśli nie: wróć do środka.
                    transform: isVisible
                      ? `translate(${x}px, ${y}px) scale(1)`
                      : `translate(0px, 0px) scale(0)`,
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? "auto" : "none",
                    // Opóźnienie zależne od indeksu - tworzy efekt fali
                    transitionDelay: isVisible ? `${i * 0.04}s` : "0s",
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
