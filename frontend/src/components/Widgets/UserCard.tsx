import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import Card from "../Common/Card";
import styles from "../Common/Card.module.scss"; // Importujemy style dla klasy .error

const UserCard: React.FC = () => {
  const { user, authLoading } = useAppContext();

  let content: React.ReactNode;

  if (authLoading) {
    content = <p>Ładowanie danych...</p>;
  } else if (!user) {
    // Używamy klasy .error z Card.module.scss
    content = <p className={styles.error}>Błąd: Brak danych użytkownika.</p>;
  } else {
    content = (
      <>
        {/* Usunięto style inline, teraz dziedziczą z .cardContent */}
        <p>
          <strong>Imię:</strong> {user.first_name}
        </p>
        <p>
          <strong>Nazwisko:</strong> {user.last_name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <small>ID USOS: {user.id}</small>
        </p>
      </>
    );
  }

  return <Card title="Twoje Dane">{content}</Card>;
};

export default UserCard;
