import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext"; // Ensure path is correct
import styles from "./Menu.module.scss"; // Ensure path is correct
import { Subject, QuizNode } from "../../assets/types.tsx"; // Ensure path is correct (using assets/)
import {
  FaUserCircle,
  FaCalculator,
  FaDatabase,
  FaReact,
  FaLock,
  FaCheck,
  FaPlay,
  FaCode,
  FaFlask,
  FaNetworkWired,
  FaAtom,
  FaMicrochip,
  FaBookOpen,
} from "react-icons/fa";

// --- EXPANDED MOCK DATA ---
const MOCK_SUBJECTS: Subject[] = [
  { id: "s1", name: "Analiza", icon: FaCalculator, color: "var(--primary)" },
  { id: "s2", name: "Bazy Danych", icon: FaDatabase, color: "var(--success)" },
  { id: "s3", name: "Frontend", icon: FaReact, color: "var(--info)" },
  {
    id: "s4",
    name: "Programowanie Obiektowe",
    icon: FaCode,
    color: "var(--warning)",
  },
  { id: "s5", name: "Fizyka I", icon: FaAtom, color: "hsl(280, 70%, 55%)" },
  {
    id: "s6",
    name: "Sieci Komputerowe",
    icon: FaNetworkWired,
    color: "hsl(30, 70%, 55%)",
  },
  {
    id: "s7",
    name: "Algorytmy",
    icon: FaMicrochip,
    color: "hsl(180, 70%, 55%)",
  },
  { id: "s8", name: "Logika", icon: FaBookOpen, color: "hsl(60, 70%, 55%)" },
];
const MOCK_QUIZZES_ANALIZA: QuizNode[] = [
  { id: "s1q1", title: "Granice", status: "completed", dependencies: [] },
  {
    id: "s1q2",
    title: "Pochodne",
    status: "completed",
    dependencies: ["s1q1"],
  },
  {
    id: "s1q3",
    title: "Zastosowania Poch.",
    status: "available",
    dependencies: ["s1q2"],
  },
  {
    id: "s1q4",
    title: "Całki Nieoznaczone",
    status: "available",
    dependencies: ["s1q2"],
  },
  {
    id: "s1q5",
    title: "Całki Oznaczone",
    status: "locked",
    dependencies: ["s1q4"],
  },
  {
    id: "s1q6",
    title: "Całki Niewłaściwe",
    status: "locked",
    dependencies: ["s1q5"],
  },
  { id: "s1q7", title: "Szeregi", status: "locked", dependencies: ["s1q1"] },
  { id: "s1q8", title: "Szeregi", status: "locked", dependencies: ["s1q1"] },
];
// --- END EXPANDED MOCK DATA ---

type MenuLevel = 0 | 1 | 2;

const Menu = () => {
  const { isMenuOpen, setIsMenuOpen } = useAppContext();
  const [level, setLevel] = useState<MenuLevel>(0);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const navigate = useNavigate();

  // State Transitions
  const openLevel1 = () => {
    setLevel(1);
    setIsMenuOpen(true);
    setActiveSubject(null);
  };
  const openLevel2 = (subject: Subject) => {
    setLevel(2);
    setActiveSubject(subject);
    setIsMenuOpen(true);
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

  // Event Handlers
  const handleCentralClick = () => {
    if (level === 0) openLevel1();
    else if (level === 1) closeMenu();
    else if (level === 2) backToLevel1();
  };
  const handleQuizClick = (quiz: QuizNode) => {
    if (quiz.status !== "locked" && activeSubject) {
      navigate(`/quiz/${activeSubject.id}/${quiz.id}`);
      closeMenu();
    } else {
      console.log(`Quiz "${quiz.title}" is locked or no active subject.`);
    }
  };

  // Effect
  useEffect(() => {
    if (!isMenuOpen && level !== 0) {
      setLevel(0);
      setActiveSubject(null);
    }
  }, [isMenuOpen, level]);

  // Helper Functions
  const getRadialPosition = (index: number, count: number, radius: number) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };
  const getQuizIcon = (status: QuizNode["status"]) => {
    switch (status) {
      case "completed":
        return <FaCheck />;
      case "available":
        return <FaPlay />;
      case "locked":
        return <FaLock />;
      default:
        return null;
    }
  };

  // Dynamic Render Variables
  const CentralIcon =
    level === 2 && activeSubject ? activeSubject.icon : FaUserCircle;
  const centralNodeScale = level === 2 ? 0.7 : 1; // Keep central node slightly smaller on Level 2 if desired
  const centralNodeColor =
    level === 2 && activeSubject ? activeSubject.color : "var(--primary)"; // Background color still changes

  // Determine quiz list
  const quizzesToShow = activeSubject ? MOCK_QUIZZES_ANALIZA : [];

  // Define radii - INCREASED radius to prevent overlap with larger nodes
  const nodeRadius = 200; // Increased distance

  return (
    <div className={styles.Container}>
      {/* SVG filter */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        className={styles.svgFilters}
      >
        <defs>
          <filter id="">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Apply filter AND add dynamic class for lines */}
      <div
        className={`${styles.menu} ${level > 0 ? styles.isExpanded : ""}`}
        style={
          {
            filter: "url(#)",
            "--menu-radius": `${nodeRadius * 2}px`,
          } as React.CSSProperties
        } // Pass radius for background size
      >
        {/* Central Node */}
        <button
          className={`${styles.node} ${styles.profileNode}`}
          onClick={handleCentralClick}
          style={
            {
              zIndex: 10,
              "--node-color": centralNodeColor, // Sets background
            } as React.CSSProperties
          }
        >
          <CentralIcon />
        </button>

        {/* Level 1: Subject Nodes */}
        {MOCK_SUBJECTS.map((subject, i) => {
          const { x, y } = getRadialPosition(
            i,
            MOCK_SUBJECTS.length,
            nodeRadius
          ); // Use new radius
          const isVisible = level === 1;
          const isActiveCentral =
            level === 2 && activeSubject?.id === subject.id;
          return (
            <button
              key={subject.id}
              className={`${styles.node} ${styles.subjectNode}`} // Class determines size now
              onClick={() => openLevel2(subject)}
              style={
                {
                  "--node-color": subject.color, // Sets border/shadow
                  transform: isVisible
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : `translate(0px, 0px) scale(0)`,
                  transitionDelay: `${i * 0.05}s`,
                  zIndex: isActiveCentral ? 9 : 5,
                  opacity: isActiveCentral ? 0 : 1,
                } as React.CSSProperties
              }
            >
              <subject.icon />
              <span>{subject.name}</span>
            </button>
          );
        })}

        {/* Level 2: Quiz Nodes */}
        {quizzesToShow.map((quiz, i) => {
          const { x, y } = getRadialPosition(
            i,
            quizzesToShow.length,
            nodeRadius
          ); // Use new radius
          const isVisible = level === 2;
          let nodeColorVar: string | undefined = undefined; // Use a different name to avoid conflict
          if (quiz.status === "available" && activeSubject)
            nodeColorVar = activeSubject.color;
          else if (quiz.status === "completed") nodeColorVar = "var(--success)";
          else if (quiz.status === "locked") nodeColorVar = "var(--tertiary)";
          return (
            <button
              key={quiz.id}
              className={`${styles.node} ${styles.quizNode} ${
                styles[quiz.status]
              }`} // Class determines size now
              onClick={() => handleQuizClick(quiz)}
              style={
                {
                  "--node-color": nodeColorVar, // Sets border/shadow
                  transform: isVisible
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : `translate(0px, 0px) scale(0)`,
                  transitionDelay: isVisible ? `${i * 0.05}s` : "0s",
                  zIndex: 7,
                } as React.CSSProperties
              }
            >
              {getQuizIcon(quiz.status)}
              <span>{quiz.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;
