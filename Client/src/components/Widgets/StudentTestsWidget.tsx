import React, { useState, useEffect } from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import {
  UsosParticipantTestsResponse,
  UsosTestRoot,
  UsosTerm,
} from "../../assets/types";
import Card from "../Common/Card";
import styles from "./StudentTestsWidget.module.scss"; // Nowy plik SCSS
import { FaClipboardList, FaEye, FaEyeSlash } from "react-icons/fa";

const StudentTestsWidget: React.FC = () => {
  const apiPath = "services/crstests/participant";

  // Ten endpoint (participant) nie wymaga parametru 'fields'.
  // Nasz zmodyfikowany hook 'useUsosApi' sobie z tym poradzi.
  const { data, loading, error } =
    useUsosApi<UsosParticipantTestsResponse>(apiPath);

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [termList, setTermList] = useState<UsosTerm[]>([]);

  useEffect(() => {
    if (data?.tests && data.terms) {
      // API zwraca obiekty (mapy), więc tworzymy posortowaną
      // listę semestrów do wyświetlenia jako zakładki.
      const sortedTermIds = Object.keys(data.terms).sort((a, b) =>
        // Proste sortowanie po ID (zazwyczaj nowsze semestry mają wyższe ID)
        b.localeCompare(a)
      );

      const terms = sortedTermIds.map((id) => data.terms[id]);
      setTermList(terms);

      // Ustaw domyślną zakładkę
      if (terms.length > 0) {
        setSelectedTermId(terms[0].id);
      }
    }
  }, [data]);

  // Funkcja renderująca pojedynczy element na liście
  const renderTestItem = (test: UsosTestRoot) => {
    const courseName =
      test.course_edition?.course_name.pl ||
      test.course_edition?.course_name.en ||
      "Przedmiot ogólny";
    const testName = test.name.pl || test.name.en || "Test bez nazwy";

    return (
      <li key={test.node_id} className={styles.testItem}>
        <div className={styles.testIcon}>
          <FaClipboardList />
        </div>
        <div className={styles.testDetails}>
          <span className={styles.testName}>{testName}</span>
          <span className={styles.courseName}>{courseName}</span>
        </div>
        <div
          className={styles.visibility}
          title={
            test.visible_for_students ? "Wyniki widoczne" : "Wyniki ukryte"
          }
        >
          {test.visible_for_students ? <FaEye /> : <FaEyeSlash />}
        </div>
      </li>
    );
  };

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie Twoich sprawdzianów...</p>;
  } else if (error) {
    content = (
      <p className={styles.error}>Błąd ładowania sprawdzianów: {error}</p>
    );
  } else if (!data || Object.keys(data.tests).length === 0) {
    content = <p>Nie znaleziono żadnych sprawdzianów (drzew ocen).</p>;
  } else {
    // Dane są, renderujemy
    const testsForSelectedTerm: UsosTestRoot[] =
      (selectedTermId ? data.tests[selectedTermId] : []) || [];

    content = (
      <div className={styles.widgetContainer}>
        {/* Zakładki z semestrami */}
        <nav className={styles.termNav}>
          {termList.map((term) => (
            <button
              key={term.id}
              className={`${styles.termButton} ${
                term.id === selectedTermId ? styles.active : ""
              }`}
              onClick={() => setSelectedTermId(term.id)}
            >
              {term.name.pl || term.name.en}
            </button>
          ))}
        </nav>

        {/* Lista testów dla wybranego semestru */}
        {testsForSelectedTerm.length > 0 ? (
          <ul className={styles.testList}>
            {testsForSelectedTerm.map(renderTestItem)}
          </ul>
        ) : (
          <p className={styles.noItems}>
            Brak sprawdzianów w wybranym semestrze.
          </p>
        )}
      </div>
    );
  }

  return <Card title="Sprawdziany i Oceny (BETA)">{content}</Card>;
};

export default StudentTestsWidget;
