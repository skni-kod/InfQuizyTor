import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import { UsosLatestGrade } from "../../assets/types";
import Card from "../Common/Card";
import styles from "./LatestGradesWidget.module.scss"; // Nowy plik SCSS

const LatestGradesWidget: React.FC = () => {
  const apiPath = "services/grades/latest";

  // Prosimy o konkretne pola z 'grade' ORAZ zagnieżdżone pole 'course_name'
  // z obiektu 'course_edition'
  const fields =
    "value_symbol|value_description|date_modified|exam_id|exam_session_number|course_edition";
  const { data, loading, error } = useUsosApi<UsosLatestGrade[]>(
    apiPath,
    fields
  );

  // Funkcja pomocnicza do formatowania daty
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "brak daty";
    try {
      return new Date(dateString).toLocaleDateString("pl-PL", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "błędna data";
    }
  };

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie ostatnich ocen...</p>;
  } else if (error) {
    content = <p className={styles.error}>Błąd ładowania ocen: {error}</p>;
  } else if (data && data.length > 0) {
    content = (
      <ul className={styles.gradeList}>
        {data.map((grade) => (
          <li
            key={`${grade.exam_id}-${grade.exam_session_number}`}
            className={styles.gradeItem}
          >
            <div className={styles.gradeSymbol}>{grade.value_symbol}</div>
            <div className={styles.gradeDetails}>
              <span className={styles.courseName}>
                {grade.course_edition.course_name.pl ||
                  grade.course_edition.course_name.en}
              </span>
              <span className={styles.gradeDescription}>
                {grade.value_description.pl || grade.value_description.en}
              </span>
              <span className={styles.gradeDate}>
                Wprowadzono: {formatDate(grade.date_modified)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  } else {
    content = <p>Nie znaleziono żadnych nowych ocen.</p>;
  }

  return <Card title="Ostatnie Oceny">{content}</Card>;
};

export default LatestGradesWidget;
