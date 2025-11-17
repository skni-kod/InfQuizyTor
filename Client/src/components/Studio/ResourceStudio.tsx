import React, { useState } from "react";
import { Subject, Topic } from "../../assets/types";
import styles from "./ResourceStudio.module.scss";
import AiContentGenerator from "./AiContentGenerator";
import ManualFlashcardForm from "./ManualFlashcardForm";
import { FaPlus, FaBrain } from "react-icons/fa";

interface ResourceStudioProps {
  subject: Subject; // Prop 'subject'
  topics: Topic[];
}

const ResourceStudio: React.FC<ResourceStudioProps> = ({ subject, topics }) => {
  // Pobieramy 'subject'
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeTool, setActiveTool] = useState<"ai" | "manual">("ai");

  return (
    <div className={styles.studioContainer}>
      <div className={styles.topicSelector}>
        {/* --- POPRAWKA: Używamy 'subject.name' --- */}
        <h3 className={styles.studioTitle}>1. Tematy z: {subject.name}</h3>
        {/* --- KONIEC POPRAWKI --- */}
        <ul className={styles.topicList}>
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                className={selectedTopic?.id === topic.id ? styles.active : ""}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.toolArea}>
        <h3 className={styles.studioTitle}>
          2. Dodaj Treści do:
          <span className={styles.topicName}>
            {selectedTopic?.name || "..."}
          </span>
        </h3>

        {!selectedTopic ? (
          <p className={styles.placeholder}>
            Najpierw wybierz temat z listy po lewej.
          </p>
        ) : (
          <>
            <div className={styles.toolTabs}>
              <button
                className={activeTool === "ai" ? styles.tabActive : ""}
                onClick={() => setActiveTool("ai")}
              >
                <FaBrain /> Generator AI (Pliki)
              </button>
              <button
                className={activeTool === "manual" ? styles.tabActive : ""}
                onClick={() => setActiveTool("manual")}
              >
                <FaPlus /> Dodaj Fiszki Ręcznie
              </button>
            </div>

            <div className={styles.toolContent}>
              {activeTool === "ai" && (
                <AiContentGenerator topicId={selectedTopic.id} />
              )}
              {activeTool === "manual" && (
                <ManualFlashcardForm topicId={selectedTopic.id} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResourceStudio;
