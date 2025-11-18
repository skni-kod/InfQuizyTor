import React, { useState } from "react";
import { Subject, Topic } from "../../assets/types";
import styles from "./ResourceStudio.module.scss";
import AiContentGenerator from "./AiContentGenerator";
import ManualFlashcardForm from "./ManualFlashcardForm";
import { FaPlus, FaBrain } from "react-icons/fa";

interface ResourceStudioProps {
  subject: Subject;
  topics: Topic[];
  onTopicCreated: () => void;
}

const ResourceStudio: React.FC<ResourceStudioProps> = ({
  subject,
  topics,
  onTopicCreated,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeTool, setActiveTool] = useState<"ai" | "manual">("ai");

  const [newTopicName, setNewTopicName] = useState("");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName) return;

    setIsCreatingTopic(true);
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subject.ID,
          name: newTopicName,
        }),
      });
      if (!response.ok) throw new Error("Błąd tworzenia tematu");

      setNewTopicName("");
      onTopicCreated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  return (
    <div className={styles.studioContainer}>
      <div className={styles.topicSelector}>
        <h3 className={styles.studioTitle}>1. Tematy z: {subject.Name}</h3>
        <ul className={styles.topicList}>
          {topics.map((topic) => (
            <li key={topic.ID}>
              <button
                className={selectedTopic?.ID === topic.ID ? styles.active : ""}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic.Name}
              </button>
            </li>
          ))}
        </ul>

        <form className={styles.newTopicForm} onSubmit={handleCreateTopic}>
          <input
            type="text"
            placeholder="Nazwa nowego tematu..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            disabled={isCreatingTopic}
          />
          <button type="submit" disabled={isCreatingTopic}>
            <FaPlus />
          </button>
        </form>
      </div>

      <div className={styles.toolArea}>
        <h3 className={styles.studioTitle}>
          2. Dodaj Treści do:
          <span className={styles.topicName}>
            {selectedTopic?.Name || "..."}
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
              {/* --- POPRAWKA: Przekazujemy ID jako string do OBU komponentów --- */}
              {activeTool === "ai" && (
                <AiContentGenerator topicId={selectedTopic.ID.toString()} />
              )}
              {activeTool === "manual" && (
                <ManualFlashcardForm topicId={selectedTopic.ID.toString()} />
              )}
              {/* --- KONIEC POPRAWKI --- */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResourceStudio;
