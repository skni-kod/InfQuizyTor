import React, { useState } from "react";
import Widget from "../Common/Widget";
import styles from "./GeminiTestPlayground.module.scss";
import { FaWandMagicSparkles, FaSpinner } from "react-icons/fa6";

// Definiujemy typy generowania, które obsłuży nasz backend
type GenerationType = "flashCards" | "quiz" | "summary";

const GeminiTestPlayground: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [outputText, setOutputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Funkcja, która będzie wywoływać nasz nowy backend Go
  const handleGenerateClick = async (type: GenerationType) => {
    if (!inputText) {
      setError("Wprowadź tekst notatek, aby coś wygenerować.");
      return;
    }

    setLoading(true);
    setError(null);
    setOutputText("");

    try {
      // Wywołujemy nowy endpoint API, który musimy stworzyć w main.go
      // (np. apiGroup.POST("/generate", handlers.HandleGenerate))
      const response = await fetch("/api/generate", {
        method: "POST",
        credentials: "include", // Ważne dla sesji
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          type: type, // Wysyłamy typ: 'flashCards', 'quiz' lub 'summary'
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Błąd serwera");
      }

      const data = await response.json();

      // Wyświetlamy ładnie sformatowany JSON
      setOutputText(JSON.stringify(data, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      console.error(`Błąd podczas generowania (${type}):`, message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Widget
      title="Plac Zabaw AI (Testowanie Gemini)"
      collapsible={true}
      defaultCollapsed={true}
      className={styles.playgroundWidget}
    >
      <div className={styles.playgroundContainer}>
        <div className={styles.inputSection}>
          <label htmlFor="ai-input">Wklej swoje notatki:</label>
          <textarea
            id="ai-input"
            className={styles.textArea}
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Wklej tutaj tekst z wykładu, PDFa lub slajdów..."
          />
          <div className={styles.buttonGroup}>
            <button
              onClick={() => handleGenerateClick("flashCards")}
              disabled={loading}
            >
              <FaWandMagicSparkles /> Generuj Fiszki
            </button>
            <button
              onClick={() => handleGenerateClick("quiz")}
              disabled={loading}
            >
              <FaWandMagicSparkles /> Generuj Quiz
            </button>
            <button
              onClick={() => handleGenerateClick("summary")}
              disabled={loading}
            >
              <FaWandMagicSparkles /> Generuj Podsumowanie
            </button>
          </div>
        </div>

        <div className={styles.outputSection}>
          <label>Wynik (JSON od Gemini):</label>
          <div className={styles.outputArea}>
            {loading && (
              <div className={styles.loadingOverlay}>
                <FaSpinner className={styles.spinner} />
                <p>Gemini myśli...</p>
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {outputText && (
              <pre>
                <code>{outputText}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </Widget>
  );
};

export default GeminiTestPlayground;
