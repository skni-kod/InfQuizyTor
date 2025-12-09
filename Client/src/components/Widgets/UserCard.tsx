import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import styles from "./UserCard.module.scss"; // Załóżmy, że plik istnieje
import { FaUser } from "react-icons/fa";
import Widget from "../Common/Widget";

const UserCard: React.FC = () => {
  // --- POPRAWKA ---
  const { authState } = useAppContext();
  // --- KONIEC POPRAWKI ---

  if (authState.authLoading) {
    return (
      <Widget
        title="Profil Użytkownika"
        collapsible={true}
        defaultCollapsed={true}
      >
        <p>Ładowanie danych...</p>
      </Widget>
    );
  }

  if (!authState.user) {
    return (
      <Widget title="Błąd" collapsible={true} defaultCollapsed={true}>
        <p>Nie udało się załadować danych użytkownika.</p>
      </Widget>
    );
  }

  // Mamy użytkownika
  return (
    <Widget
      title="Witaj"
      collapsible={true}
      defaultCollapsed={true}
      className={styles.userCard}
    >
      <FaUser className={styles.userIcon} />
      <div className={styles.userInfo}>
        <span className={styles.userName}>
          {authState.user.first_name} {authState.user.last_name}
        </span>
        <span className={styles.userEmail}>{authState.user.email}</span>
      </div>
    </Widget>
  );
};

// Style (dodaj ten plik, jeśli go nie masz)
/* Plik: UserCard.module.scss */
/*
.userCard {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.userIcon {
  font-size: 2.5rem;
  color: var(--primary);
  flex-shrink: 0;
}
.userInfo {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.userName {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.userEmail {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
*/

export default UserCard;
