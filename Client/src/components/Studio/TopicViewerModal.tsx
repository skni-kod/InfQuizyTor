import React, { useEffect, useState } from "react";
import {
  Topic,
  GeneratedFlashcard,
  GeneratedQuizQuestion,
} from "../../assets/types";
import styles from "./TopicViewerModal.module.scss";
import { FaTimes } from "react-icons/fa";

interface TopicViewerModalProps {
  topic: Topic | null;
  onClose: () => void;
}

// Mock Data (zastąp wywołaniami API)
const MOCK_FLASHCARDS: GeneratedFlashcard[] = [
  { question: "Co to jest całka krzywoliniowa?", answer: "To całka..." },
  { question: "Jakie jest Twierdzenie Greena?", answer: "Relacja..." },
];

const MOCK_QUIZ: GeneratedQuizQuestion[] = [
  {
    question: "Kto wymyślił całki?",
    options: ["Newton", "Leibniz", "Obaj"],
    correctIndex: 2,
  },
];

const TopicViewerModal: React.FC<TopicViewerModalProps> = ({
  topic,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("notes");

  // Stan na wczytywanie danych (TODO)
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [quiz, setQuiz] = useState<GeneratedQuizQuestion[]>([]);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (topic) {
      // W tym miejscu wywołałbyś API, aby pobrać zaakceptowane treści
      // np. GET /api/topics/1/content
      setLoading(true);
      setTimeout(() => {
        // Symulacja ładowania
        setSummary(
          "To jest *wygenerowane* podsumowanie dla tematu: " + topic.Name
        );
        setFlashcards(MOCK_FLASHCARDS);
        setQuiz(MOCK_QUIZ);
        setLoading(false);
      }, 500);
    }
  }, [topic]);

  if (!topic) {
    return null; // Nie renderuj nic, jeśli nie ma wybranego tematu
  }

  return (
    // 'Scrim' to tło, które można kliknąć, aby zamknąć
    <div className={styles.scrim} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <h2>{topic.Name}</h2>

        <div className={styles.tabs}>
          <button
            className={activeTab === "notes" ? styles.tabActive : ""}
            onClick={() => setActiveTab("notes")}
          >
            Notatki AI
          </button>
          <button
            className={activeTab === "flashcards" ? styles.tabActive : ""}
            onClick={() => setActiveTab("flashcards")}
          >
            Fiszki
          </button>
          <button
            className={activeTab === "quiz" ? styles.tabActive : ""}
            onClick={() => setActiveTab("quiz")}
          >
            Quiz
          </button>
        </div>

        <div className={styles.contentArea}>
          {loading ? (
            <p>Wczytywanie materiałów...</p>
          ) : (
            <>
              {activeTab === "notes" && (
                <div
                  className={styles.notesContent}
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              )}
              {activeTab === "flashcards" && (
                <div>
                  {/* TODO: Zastąp to prawdziwym komponentem fiszek */}
                  <pre>{JSON.stringify(flashcards, null, 2)}</pre>
                  <button className={styles.startButton}>
                    Rozpocznij Powtórkę
                  </button>
                </div>
              )}
              {activeTab === "quiz" && (
                <div>
                  {/* TODO: Zastąp to prawdziwym komponentem quizu */}
                  <pre>{JSON.stringify(quiz, null, 2)}</pre>
                  <button className={styles.startButton}>
                    Rozpocznij Quiz
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicViewerModal;
