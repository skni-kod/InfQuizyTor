import React, { useEffect, useState } from "react";
import styles from "./UsosGroups.module.scss";
// Zastępujemy Card na Widget
import Widget from "../Common/Widget";
// Importy dla FaExternalLinkAlt możesz dodać, jeśli chcesz ikonę przy linku USOSweb

// --- Typy danych (upewnij się, że są zgodne z models.go) ---
interface LangDict {
  pl: string;
  en: string;
}
interface UsosGroupMember {
  id: string;
  first_name: string;
  last_name: string;
  titles?: string;
}
interface UsosGroupDetails {
  course_unit_id: string;
  group_number: number;
  class_type: LangDict;
  class_type_id: string;
  course_id: string;
  course_name: LangDict;
  group_url: string;
  term_id: string;
  lecturers: UsosGroupMember[] | null;
  participants: UsosGroupMember[] | null;
  relationship_type: "participant" | "lecturer";
}
interface UsosTerm {
  id: string;
  name: LangDict;
  start_date: string;
  end_date: string;
}
interface UsosGroupsResponse {
  groups: Record<string, UsosGroupDetails[]>;
  terms: UsosTerm[];
}

// --- Komponent Główny ---

const UsosGroups: React.FC = () => {
  const [data, setData] = useState<UsosGroupsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Zmieniamy na ID aktywnego semestru, usuwamy logikę rozwijania
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  // ... (Logika fetchGroups, useEffect)
  const fetchGroups = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/groups/all", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage =
          errorBody?.error ||
          `${response.statusText} (Brak szczegółowego komunikatu błędu z serwera Go)`;
        throw new Error(
          `Błąd pobierania grup (HTTP ${response.status}): ${errorMessage}`
        );
      }

      const result: UsosGroupsResponse = await response.json();
      setData(result);

      if (result.terms && result.terms.length > 0) {
        // Ustawiamy domyślny semestr (pierwszy z listy)
        setSelectedTermId(result.terms[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const getLang = (dict: LangDict) => dict?.pl || dict?.en || "";

  // Zaczynamy budowanie zawartości widgeta
  let content: React.ReactNode;

  if (loading)
    content = <div className={styles.loading}>Ładowanie grup USOS...</div>;
  else if (error) content = <div className={styles.error}>Błąd: {error}</div>;
  else if (!data || !data.terms || data.terms.length === 0)
    content = <div className={styles.empty}>Brak grup zajęciowych.</div>;
  else {
    // Filtrujemy tylko te semestry, które mają grupy (jak w UserCoursesWidget)
    const termList = data.terms.filter(
      (term) => (data.groups[term.id] || []).length > 0
    );
    const groupsForSelectedTerm =
      (selectedTermId && data.groups[selectedTermId]) || [];

    content = (
      <div className={styles.groupsWidgetContent}>
        {/* ZAKŁADKI SEMESTRÓW */}
        <nav className={styles.termNav}>
          {termList.map((term) => (
            <button
              key={term.id}
              className={`${styles.termButton} ${
                term.id === selectedTermId ? styles.active : ""
              }`}
              onClick={() => setSelectedTermId(term.id)}
            >
              {getLang(term.name)}
            </button>
          ))}
        </nav>

        {/* GRUPY ZAJĘCIOWE DLA AKTYWNEGO SEMESTRU */}
        {groupsForSelectedTerm.length > 0 ? (
          // groupsGrid zostaje, ale bez warunku isExpanded
          <div className={styles.groupsGrid}>
            {groupsForSelectedTerm.map((group) => (
              <Widget
                key={`${group.course_unit_id}-${group.group_number}`}
                title={getLang(group.course_name)} // Tytuł karty to nazwa kursu
                className={styles.groupCardBody} // Klasa dla zawartości Card
              >
                {/* Wewnętrzna sekcja nagłówkowa karty (Typ zajęć i numer) */}
                <div className={styles.groupHeaderContent}>
                  <span
                    className={`${styles.badge} ${
                      styles[group.class_type_id] || styles.defaultBadge
                    }`}
                  >
                    {getLang(group.class_type)}
                  </span>
                  <span className={styles.groupNumber}>
                    Gr. {group.group_number}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.roleInfo}>
                    Rola:{" "}
                    <strong>
                      {group.relationship_type === "lecturer"
                        ? "Prowadzący"
                        : "Student"}
                    </strong>
                  </div>

                  {/* Zabezpieczenie przed null */}
                  {(group.lecturers || []).length > 0 && (
                    <div className={styles.lecturers}>
                      <strong>Prowadzący:</strong>
                      <ul>
                        {(group.lecturers || []).map((l) => (
                          <li key={l.id}>
                            {l.titles} {l.first_name} {l.last_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  {group.group_url && (
                    <a
                      href={group.group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.usosLink}
                    >
                      Otwórz w USOSweb
                    </a>
                  )}
                </div>
              </Widget>
            ))}
          </div>
        ) : (
          <p className={styles.noGroups}>
            Brak grup zajęciowych w wybranym semestrze.
          </p>
        )}
      </div>
    );
  }

  // WRAZ ZAWartość W JEDEN WIDGET
  return (
    <Widget
      title="Twoje Grupy Zajęciowe"
      collapsible={true}
      defaultCollapsed={true}
    >
      {content}
    </Widget>
  );
};

export default UsosGroups;
