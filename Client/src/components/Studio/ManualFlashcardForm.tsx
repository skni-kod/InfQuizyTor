import React, { useState } from "react";
import styles from "./ManualFlashcardForm.module.scss";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

interface ManualFlashcardFormProps {
  topicId: string;
}

type Status = "idle" | "loading" | "success" | "error";

const ManualFlashcardForm: React.FC<ManualFlashcardFormProps> = ({
  topicId,
}) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) {
      setStatus("error");
      setMessage("Pytanie i odpowiedź nie mogą być puste.");
      return;
    }

    setStatus("loading");
    setMessage("Wysyłanie fiszki do moderacji...");

    try {
      // TODO: Stwórz ten endpoint w Go
      const response = await fetch("/api/flashcards/manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicId,
          question: question,
          answer: answer,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd serwera");

      setStatus("success");
      setMessage("Fiszka wysłana do moderacji!");
      setQuestion("");
      setAnswer("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <h4>Dodaj Fiszki Ręcznie</h4>
      <p className={styles.desc}>
        Fiszki dodane tutaj trafią do kolejki moderacyjnej, zanim staną się
        publiczne.
      </p>

      <div className={styles.formGroup}>
        <label htmlFor="question">Pytanie (Awers)</label>
        <textarea
          id="question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="np. Co to jest całka oznaczona?"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="answer">Odpowiedź (Rewers)</label>
        <textarea
          id="answer"
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="np. Pole powierzchni pod wykresem funkcji..."
        />
      </div>

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Wysyłanie..." : "Wyślij do Akceptacji"}
      </button>

      {/* Komunikaty statusu */}
      {status === "loading" && (
        <div className={styles.statusMessage}>
          <FaSpinner className="icon-spin" /> {message}
        </div>
      )}
      {status === "success" && (
        <div className={`${styles.statusMessage} ${styles.success}`}>
          <FaCheckCircle /> {message}
        </div>
      )}
      {status === "error" && (
        <div className={`${styles.statusMessage} ${styles.error}`}>
          <FaExclamationTriangle /> {message}
        </div>
      )}
    </form>
  );
};

export default ManualFlashcardForm;
