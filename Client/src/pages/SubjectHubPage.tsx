import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./SubjectHubPage.module.scss";
// POPRAWKA: Importujemy czysty typ `Subject`
import { Subject, Topic } from "../assets/types.tsx";
import QuizGraph from "../components/Quiz/QuizGraph";
import ResourceStudio from "../components/Studio/ResourceStudio";
import TopicViewerModal from "../components/Studio/TopicViewerModal";
import { FaArrowLeft } from "react-icons/fa";

const SubjectHubPage: React.FC = () => {
  const { subjectId } = useParams(); // subjectId to UsosID
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("path");
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null); // Zmieniono na null
  const [topics, setTopics] = useState<Topic[]>([]);
  const [_loading, setLoading] = useState(true); // Ustaw na true na początku
  const [error, setError] = useState<string | null>(null);

  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);

  const fetchSubjectData = async (id: string) => {
    setLoading(true);
    setError(null);

    // KLUCZOWE POPRAWKI:
    // 1. Dekodowanie URI: Używamy decodeURIComponent, aby UsosID z URL był poprawny.
    const decodedSubjectId = decodeURIComponent(id);

    // 2. Opcja credentials: 'include' jest KLUCZOWA do wysłania ciasteczek sesyjnych
    const fetchOptions: RequestInit = {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      // 1. Fetch Danych Przedmiotu
      const subjectResponse = await fetch(
        `/api/subjects/${decodedSubjectId}`,
        fetchOptions
      );

      if (!subjectResponse.ok) {
        // Poprawka: Jeśli dostaniemy 401, informujemy użytkownika o konieczności zalogowania.
        if (subjectResponse.status === 401) {
          throw new Error("Wymagane ponowne logowanie (Sesja wygasła).");
        }
        throw new Error(`Błąd ładowania przedmiotu: ${subjectResponse.status}`);
      }
      const subjectData: Subject = await subjectResponse.json();
      setCurrentSubject(subjectData);

      // 2. Fetch Tematów
      const topicsResponse = await fetch(
        `/api/subjects/${decodedSubjectId}/topics`,
        fetchOptions
      );
      if (!topicsResponse.ok) {
        throw new Error(`Błąd ładowania tematów: ${topicsResponse.status}`);
      }
      const topicsData: Topic[] = await topicsResponse.json();
      setTopics(topicsData);
    } catch (e) {
      console.error("Błąd ładowania danych przedmiotu:", e);
      // Ustawienie błędu dla frontendu
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Wystąpił nieznany błąd podczas ładowania danych.");
      }
      setCurrentSubject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      fetchSubjectData(subjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    fetchSubjectData(subjectId!);
  };

  if (error || !currentSubject) {
    return (
      <div className={styles.hubContainer}>
        <p className={styles.errorText}>
          {error || "Nie znaleziono przedmiotu."}
        </p>
      </div>
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
                subject={currentSubject}
                UsosID={currentSubject.UsosID}
                topics={topics}
                onNodeClick={handleNodeClick}
                onBack={handleBackToDashboard}
                subjectColor={"var(--primary)"}
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
