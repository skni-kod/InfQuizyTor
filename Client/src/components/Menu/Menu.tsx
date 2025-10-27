import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useAppContext } from "../../contexts/AppContext";
import styles from "./Menu.module.scss";
import { Subject, QuizNode } from "../../assets/types";
import {
  FaUserCircle,
  FaCalculator,
  FaDatabase,
  FaReact,
  FaLock,
  FaCheck,
  FaPlay,
} from "react-icons/fa";

// --- Mock Data (Keep or replace with actual data fetching) ---
const MOCK_SUBJECTS: Subject[] = [
  { id: "s1", name: "Analiza", icon: FaCalculator, color: "var(--primary)" },
  { id: "s2", name: "Bazy Danych", icon: FaDatabase, color: "var(--success)" },
  { id: "s3", name: "Frontend", icon: FaReact, color: "var(--info)" },
];

const MOCK_QUIZZES: QuizNode[] = [
  { id: "q1", title: "Podstawy", status: "completed", dependencies: [] },
  { id: "q2", title: "Pochodne", status: "available", dependencies: [] },
  { id: "q3", title: "Całki", status: "locked", dependencies: [] },
  { id: "q4", title: "Różniczki", status: "locked", dependencies: [] },
];
// --- End Mock Data ---

type MenuLevel = 0 | 1 | 2;

const Menu = () => {
  const { isMenuOpen, setIsMenuOpen } = useAppContext(); // Include isMenuOpen for potential effects
  const [level, setLevel] = useState<MenuLevel>(0);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleLevel0Click = () => {
    setLevel(1);
    setIsMenuOpen(true);
  };

  const handleSubjectClick = (subject: Subject) => {
    // Navigate to the subject page
    navigate(`/przedmioty/${subject.id}`);

    // Reset menu state after navigation
    setLevel(0);
    setActiveSubject(null);
    setIsMenuOpen(false);
  };

  const handleBackToLevel1 = () => {
    // Used by central button on Level 2
    setLevel(1);
    setActiveSubject(null);
    // Keep isMenuOpen true as we are still in an open state (Level 1)
  };

  const handleCentralClick = () => {
    if (level === 0) {
      handleLevel0Click();
    } else if (level === 1) {
      // Click central node on Level 1 to close
      setLevel(0);
      setIsMenuOpen(false);
      setActiveSubject(null);
    } else if (level === 2) {
      // Click central node on Level 2 to go back to Level 1
      handleBackToLevel1();
    }
  };

  // Helper function for radial position
  const getRadialPosition = (index: number, count: number, radius: number) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // Helper function for quiz status icon
  const getQuizIcon = (status: QuizNode["status"]) => {
    switch (status) {
      case "completed":
        return <FaCheck />;
      case "available":
        return <FaPlay />;
      case "locked":
        return <FaLock />;
    }
  };

  // Determine the icon for the central node
  const CentralIcon =
    activeSubject && level === 2 ? activeSubject.icon : FaUserCircle;

  // Optional: Effect to reset internal state if global state forces close (e.g., backdrop click)
  React.useEffect(() => {
    if (!isMenuOpen && level !== 0) {
      setLevel(0);
      setActiveSubject(null);
    }
  }, [isMenuOpen, level]);

  return (
    <div className={styles.Container}>
      {/* SVG filter definition */}
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

      {/* Main menu container */}
      <div className={styles.menu} style={{ filter: "url(#)" }}>
        {/* Central Node (Profile / Active Subject) */}
        <button
          className={`${styles.node} ${styles.profileNode}`}
          onClick={handleCentralClick}
          style={
            {
              transform: `scale(${level === 2 ? 0.8 : 1})`, // Smaller on Level 2
              zIndex: 10,
              "--node-color":
                level === 2 && activeSubject
                  ? activeSubject.color
                  : "var(--primary)",
            } as React.CSSProperties
          }
        >
          <CentralIcon />
        </button>

        {/* Level 1: Subject Nodes */}
        {MOCK_SUBJECTS.map((subject, i) => {
          const { x, y } = getRadialPosition(i, MOCK_SUBJECTS.length, 160);
          const isVisible = level === 1;
          return (
            <button
              key={subject.id}
              className={`${styles.node} ${styles.subjectNode}`}
              onClick={() => handleSubjectClick(subject)} // Navigates on click
              style={
                {
                  "--node-color": subject.color,
                  transform: isVisible
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : "translate(0, 0) scale(0)",
                  transitionDelay: `${i * 0.05}s`,
                  zIndex: 5,
                } as React.CSSProperties
              }
            >
              <subject.icon />
              <span>{subject.name}</span>
            </button>
          );
        })}

        {/* Level 2: Quiz Nodes */}
        {MOCK_QUIZZES.map((quiz, i) => {
          const { x, y } = getRadialPosition(i, MOCK_QUIZZES.length, 120);
          const isVisible = level === 2;
          return (
            <button
              key={quiz.id}
              className={`${styles.node} ${styles.quizNode} ${
                styles[quiz.status]
              }`}
              onClick={() => {
                if (quiz.status !== "locked") {
                  // Example: Navigate to a specific quiz page (needs Route definition)
                  // navigate(`/quiz/${activeSubject?.id}/${quiz.id}`);
                  console.log(
                    `Maps to quiz: ${activeSubject?.name} - ${quiz.title}`
                  ); // Placeholder
                  // Optionally reset menu state after quiz navigation
                  // setLevel(0);
                  // setIsMenuOpen(false);
                }
              }}
              style={
                {
                  transform: isVisible
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : "translate(0, 0) scale(0)",
                  transitionDelay: `${i * 0.05}s`,
                  zIndex: 7, // Above subjects, below central node
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
