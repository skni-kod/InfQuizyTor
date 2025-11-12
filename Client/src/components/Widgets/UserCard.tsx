import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import Card from "../Common/Card";
import styles from "./UserCard.module.scss"; // Załóżmy, że plik istnieje
import { FaUser } from "react-icons/fa";

const UserCard: React.FC = () => {
  // --- POPRAWKA ---
  const { authState } = useAppContext();
  // --- KONIEC POPRAWKI ---

  if (authState.authLoading) {
    return (
      <Card title="Profil Użytkownika">
        <p>Ładowanie danych...</p>
      </Card>
    );
  }

  if (!authState.user) {
    return (
      <Card title="Błąd">
        <p>Nie udało się załadować danych użytkownika.</p>
      </Card>
    );
  }

  // Mamy użytkownika
  return (
    <Card title="Witaj" className={styles.userCard}>
      <FaUser className={styles.userIcon} />
      <div className={styles.userInfo}>
        <span className={styles.userName}>
          {authState.user.first_name} {authState.user.last_name}
        </span>
        <span className={styles.userEmail}>{authState.user.email}</span>
      </div>
    </Card>
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
