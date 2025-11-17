import React, { useState, useCallback } from "react";
import styles from "./AiContentGenerator.module.scss";
import { useDropzone } from "react-dropzone"; // Potrzebujesz 'pnpm add react-dropzone'
import {
  FaFileUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

interface AiContentGeneratorProps {
  topicId: string;
}

type Status = "idle" | "loading" | "success" | "error";

const AiContentGenerator: React.FC<AiContentGeneratorProps> = ({ topicId }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((f) => f.name !== fileName));
  };

  const handleSubmit = async (genType: "quiz" | "flashcards") => {
    if (files.length === 0 && !notes) {
      setStatus("error");
      setMessage("Dodaj pliki lub notatki, aby coś wygenerować.");
      return;
    }

    setStatus("loading");
    setMessage("Przesyłanie i analiza AI...");

    const formData = new FormData();
    formData.append("topic_id", topicId);
    formData.append("type", genType);
    formData.append("notes", notes);
    files.forEach((file) => {
      formData.append("images", file, file.name); // 'images' musi pasować do handlera Go
    });

    try {
      const response = await fetch("/api/topics/upload", {
        method: "POST",
        credentials: "include",
        body: formData, // Nie ustawiaj 'Content-Type', przeglądarka zrobi to za Ciebie
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nieznany błąd serwera");
      }

      setStatus("success");
      setMessage(data.message || "Treści wysłane do moderacji!");
      setFiles([]);
      setNotes("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Błąd sieci");
    }
  };

  return (
    <div className={styles.aiContainer}>
      <h4>Generator AI (Gemini 1.5 Pro)</h4>
      <p className={styles.desc}>
        Przeciągnij i upuść pliki (`.jpg`, `.png`, `.pdf`, `.txt`) lub wpisz
        notatki poniżej. AI przeanalizuje wszystko i wygeneruje treści.
      </p>

      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${
          isDragActive ? styles.dragActive : ""
        }`}
      >
        <input {...getInputProps()} />
        <FaFileUpload />
        {isDragActive ? (
          <p>Upuść pliki tutaj...</p>
        ) : (
          <p>Przeciągnij pliki lub kliknij, aby je wybrać</p>
        )}
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file) => (
            <div key={file.name} className={styles.fileItem}>
              <span>{file.name}</span>
              <button onClick={() => removeFile(file.name)}>&times;</button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className={styles.notesInput}
        rows={5}
        placeholder="Dodaj opcjonalne notatki tekstowe tutaj..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className={styles.buttonGroup}>
        <button
          onClick={() => handleSubmit("flashcards")}
          disabled={status === "loading"}
        >
          Generuj Fiszki
        </button>
        <button
          onClick={() => handleSubmit("quiz")}
          disabled={status === "loading"}
        >
          Generuj Quiz
        </button>
      </div>

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
    </div>
  );
};

export default AiContentGenerator;
