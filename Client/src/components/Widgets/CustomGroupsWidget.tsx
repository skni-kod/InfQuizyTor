import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import {
  UsosCustomGroup,
  // Usunięto nieużywane importy
} from "../../assets/types";
import Card from "../Common/Card";
import styles from "./CustomGroupsWidget.module.scss";
import {
  FaUsers,
  // FaUserTag, FaUser, FaEnvelope, FaChevronDown,
} from "react-icons/fa";

const CustomGroupsWidget: React.FC = () => {
  const apiPath = "services/csgroups/user";

  // --- POPRAWKA ---
  // Prosimy TYLKO o pola podstawowe, zgodnie z dokumentacją i błędem
  const fields = "id|name";
  // --- KONIEC POPRAWKI ---

  const { data, loading, error } = useUsosApi<UsosCustomGroup[]>(
    apiPath,
    fields
  );

  // --- USUNIĘTO ---
  // Cała logika 'getMemberCount', 'renderMembers' i <details>
  // została usunięta, ponieważ nie możemy pobrać tych danych
  // za pomocą tego endpointu.
  // --- KONIEC USUNIĘCIA ---

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie grup niestandardowych...</p>;
  } else if (error) {
    content = <p className={styles.error}>Błąd ładowania grup: {error}</p>;
  } else if (data && data.length > 0) {
    content = (
      <ul className={styles.groupList}>
        {data.map((group) => (
          // Prosta lista, bez rozwijania
          <li key={group.id} className={styles.groupItem}>
            <FaUsers />
            <span className={styles.groupName}>{group.name}</span>
          </li>
        ))}
      </ul>
    );
  } else {
    content = <p>Nie znaleziono żadnych grup niestandardowych.</p>;
  }

  return <Card title="Twoje Grupy (BETA)">{content}</Card>;
};

export default CustomGroupsWidget;
