import React, { useState, useEffect } from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import {
  UsosUserCoursesResponse,
  UsosTerm,
  UsosCourseEdition,
} from "../../assets/types";
import Card from "../Common/Card";
import styles from "./UserCoursesWidget.module.scss";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExternalLinkAlt,
} from "react-icons/fa";

const UserCoursesWidget: React.FC = () => {
  const apiPath = "services/courses/user";
  // Prosimy o listę semestrów ORAZ o edycje kursów z konkretnymi polami
  // To jest przykład zagnieżdżonego selektora pól w API USOS

  const fields = "terms|course_editions";
  const { data, loading, error } = useUsosApi<UsosUserCoursesResponse>(
    apiPath,
    fields
  );

  // Będziemy trzymać w stanie ID aktywnego (wybranego) semestru
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  // Ustaw domyślny semestr (pierwszy z listy) po załadowaniu danych
  useEffect(() => {
    if (data?.terms && data.terms.length > 0) {
      setSelectedTermId(data.terms[0].id); // Domyślnie najnowszy semestr
    }
  }, [data]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className={`${styles.statusBadge} ${styles.passed}`}>
            <FaCheckCircle /> Zaliczone
          </span>
        );
      case "failed":
        return (
          <span className={`${styles.statusBadge} ${styles.failed}`}>
            <FaTimesCircle /> Niezaliczone
          </span>
        );
      case "not_yet_passed":
        return (
          <span className={`${styles.statusBadge} ${styles.pending}`}>
            <FaClock /> W trakcie
          </span>
        );
      default:
        return null;
    }
  };

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie Twoich przedmiotów...</p>;
  } else if (error) {
    content = (
      <p className={styles.error}>Błąd ładowania przedmiotów: {error}</p>
    );
  } else if (!data || data.terms.length === 0 || !data.course_editions) {
    content = <p>Nie znaleziono żadnych zapisów na przedmioty.</p>;
  } else {
    // Dane są, możemy renderować
    const coursesForSelectedTerm: UsosCourseEdition[] =
      (selectedTermId ? data.course_editions[selectedTermId] : []) || [];

    content = (
      <div className={styles.courseWidget}>
        {/* Pasek z przełącznikami semestrów */}
        <nav className={styles.termNav}>
          {data.terms.map((term) => (
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

        {/* Lista przedmiotów dla wybranego semestru */}
        {coursesForSelectedTerm.length > 0 ? (
          <ul className={styles.courseList}>
            {coursesForSelectedTerm.map((course) => (
              <li key={course.course_id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  {course.profile_url ? (
                    <a
                      href={course.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.courseName}
                    >
                      {course.course_name.pl || course.course_name.en}
                      <FaExternalLinkAlt className={styles.linkIcon} />
                    </a>
                  ) : (
                    <span className={styles.courseName}>
                      {course.course_name.pl || course.course_name.en}
                    </span>
                  )}
                  {renderStatusBadge(course.passing_status)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noCourses}>
            Brak przedmiotów w wybranym semestrze.
          </p>
        )}
      </div>
    );
  }

  return <Card title="Moje Przedmioty (BETA)">{content}</Card>;
};

export default UserCoursesWidget;
