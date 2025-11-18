import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./SubjectHubPage.module.scss";
// POPRAWKA: Importujemy czysty typ `Subject`
import { Subject, Topic } from "../assets/types.tsx";
import QuizGraph from "../components/Quiz/QuizGraph";
import ResourceStudio from "../components/Studio/ResourceStudio";
import TopicViewerModal from "../components/Studio/TopicViewerModal";
import { FaArrowLeft } from "react-icons/fa";

// POPRAWKA: Typ MOCK_SUBJECT_DATA to teraz 'Subject'
const MOCK_SUBJECT_DATA: Subject = {
  ID: 1,
  UsosID: "s1",
  Name: "Analiza Matematyczna",
};

const SubjectHubPage: React.FC = () => {
  const { subjectId } = useParams(); // subjectId to UsosID
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("path");

  // POPRAWKA: Stan przechowuje teraz typ 'Subject'
  const [currentSubject, setCurrentSubject] =
    useState<Subject>(MOCK_SUBJECT_DATA);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);

  const fetchSubjectData = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      // TODO: Zaimplementuj /api/subjects/:id
      // Na razie używamy mocka, ale upewniamy się, że pasuje do typu
      const mockSubject = { ...MOCK_SUBJECT_DATA, UsosID: subjectId, ID: 0 }; // ID z bazy byłoby nieznane
      setCurrentSubject(mockSubject);

      // --- POPRAWKA: fetchTopics ---
      // Stary URL: /api/topics?subject_id=${subjectId}
      const topicsRes = await fetch(
        `/api/subjects/${subjectId}/topics`, // Zgodny z main.go
        {
          credentials: "include",
        }
      );
      // --- KONIEC POPRAWKI ---

      if (!topicsRes.ok) throw new Error("Nie udało się pobrać tematów");
      const topicsData: Topic[] = await topicsRes.json();
      setTopics(topicsData);
    } catch (error) {
      console.error("Błąd ładowania danych przedmiotu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  const handleNodeClick = (topic: Topic) => {
    setViewingTopic(topic);
  };

  const handleCloseModal = () => {
    setViewingTopic(null);
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const refreshTopics = () => {
    fetchSubjectData();
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>Ładowanie danych przedmiotu...</div>
    );
  }

  return (
    <>
      <div className={styles.hubContainer}>
        <button onClick={handleBackToDashboard} className={styles.backButton}>
          <FaArrowLeft /> Wróć do pulpitu
        </button>

        <h1 className={styles.subjectTitle}>{currentSubject.Name}</h1>

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
            Studio Treści
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
                subject={currentSubject} // Przekazujemy cały obiekt Subject
                UsosID={currentSubject.UsosID} // Prop UsosID
                topics={topics}
                onNodeClick={handleNodeClick}
                onBack={handleBackToDashboard}
                subjectColor={"var(--primary)"} // Przekaż domyślny kolor
              />
            </div>
          )}
          {activeTab === "resources" && (
            <ResourceStudio
              subject={currentSubject}
              topics={topics}
              onTopicCreated={refreshTopics}
            />
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
