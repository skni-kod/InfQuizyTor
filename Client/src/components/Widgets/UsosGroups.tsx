import React, { useEffect, useState } from "react";
import styles from "./UsosGroups.module.scss";
import Card from "../Common/Card"; // <-- Dodano import komponentu Card!
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
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>(
    {}
  );

  // ... (Logika fetchGroups, useEffect, toggleTerm bez zmian)
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
        setExpandedTerms({ [result.terms[0].id]: true });
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

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => ({
      ...prev,
      [termId]: !prev[termId],
    }));
  };
  const getLang = (dict: LangDict) => dict?.pl || dict?.en || "";

  if (loading)
    return <div className={styles.loading}>Ładowanie grup USOS...</div>;
  if (error) return <div className={styles.error}>Błąd: {error}</div>;
  if (!data || !data.terms || data.terms.length === 0)
    return <div className={styles.empty}>Brak grup zajęciowych.</div>;

  return (
    <div className={styles.groupsContainer}>
      {data.terms.map((term) => {
        const termGroups = data.groups[term.id];
        if (!termGroups || termGroups.length === 0) return null;

        const isExpanded = expandedTerms[term.id];

        return (
          <div key={term.id} className={styles.termSection}>
            <div
              className={`${styles.termHeader} ${
                isExpanded ? styles.active : ""
              }`}
              onClick={() => toggleTerm(term.id)}
            >
              <h3>Grupy Zajęciowe {getLang(term.name)}</h3>
              <span className={styles.toggleIcon}>
                {isExpanded ? "−" : "+"}
              </span>
            </div>

            {isExpanded && (
              <div className={styles.groupsGrid}>
                {/* Użycie komponentu Card dla każdej grupy */}
                {termGroups.map((group) => (
                  <Card
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UsosGroups;
