import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./SubjectHubPage.module.scss";
import { Subject, Topic } from "../assets/types.tsx";

// Importy komponentów
import QuizGraph from "../components/Quiz/QuizGraph";
import ResourceStudio from "../components/Studio/ResourceStudio";
import TopicViewerModal from "../components/Studio/TopicViewerModal";
import { FaArrowLeft } from "react-icons/fa";

// Mock (do zastąpienia prawdziwymi danymi z API)
const MOCK_SUBJECT_DATA: Subject = {
  id: "s1",
  name: "Analiza Matematyczna",
  icon: () => null,
  color: "",
};
const MOCK_TOPICS: Topic[] = [
  { id: "t1", name: "Podstawy Równań", subject_id: "s1" },
  { id: "t2", name: "Pochodne Cząstkowe", subject_id: "s1" },
  { id: "t3", name: "Całki Wielokrotne", subject_id: "s1" },
  { id: "t4", name: "Całki Krzywoliniowe", subject_id: "s1" },
  { id: "t5", name: "Twierdzenie Greena", subject_id: "s1" },
];

const SubjectHubPage: React.FC = () => {
  const { subjectId } = useParams(); // Pobieramy subjectId
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("path");
  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);

  // Funkcje
  const handleNodeClick = (topic: Topic) => {
    console.log("Wybrano temat:", topic.name);
    setViewingTopic(topic);
  };

  const handleCloseModal = () => {
    setViewingTopic(null);
  };

  const handleBackToDashboard = () => {
    navigate("/"); // Wróć do pulpitu
  };

  // --- POPRAWKA: Używamy 'subjectId' ---
  // TODO: Zastąp MOCK_... prawdziwym ładowaniem danych
  // useEffect(() => {
  //   // Tutaj wywołałbyś API, aby pobrać dane przedmiotu i tematów
  //   // na podstawie 'subjectId'
  //   // np. fetch(`/api/subjects/${subjectId}`)
  //   // np. fetch(`/api/subjects/${subjectId}/topics`)
  // }, [subjectId]); // Używamy 'subjectId' jako zależności

  // Na razie zostawiamy mock, ale lint wie, że 'subjectId' ma cel
  if (!subjectId) {
    return <p>Nie wybrano przedmiotu</p>; // Obsługa braku ID
  }

  const currentSubject = MOCK_SUBJECT_DATA;
  const topics = MOCK_TOPICS;
  // --- KONIEC POPRAWKI ---

  return (
    <>
      <div className={styles.hubContainer}>
        <button onClick={handleBackToDashboard} className={styles.backButton}>
          <FaArrowLeft /> Wróć do pulpitu
        </button>

        <h1 className={styles.subjectTitle}>{currentSubject.name}</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "path" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("path")}
          >
            Ścieżka Nauki
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "resources" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("resources")}
          >
            Studio Treści (Zasoby)
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "contact" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("contact")}
          >
            Kontakt
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "path" && (
            <div className={styles.graphContainer}>
              <QuizGraph
                subject={currentSubject}
                onNodeClick={handleNodeClick}
                onBack={handleBackToDashboard}
              />
            </div>
          )}
          {activeTab === "resources" && (
            <ResourceStudio subject={currentSubject} topics={topics} />
          )}
          {activeTab === "contact" && (
            <div className={styles.contactInfo}>
              <p>Informacje o prowadzących, konsultacje itp.</p>
            </div>
          )}
        </div>
      </div>

      <TopicViewerModal topic={viewingTopic} onClose={handleCloseModal} />
    </>
  );
};

export default SubjectHubPage;
