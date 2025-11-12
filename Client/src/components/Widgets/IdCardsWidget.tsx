import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import { UsosCard } from "../../assets/types";
import Card from "../Common/Card";
import styles from "./IdCardsWidget.module.scss";

// Importujmy ikony dla różnych typów kart
import { FaIdCard } from "react-icons/fa";
import { PiStudentBold } from "react-icons/pi";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";

const IdCardsWidget: React.FC = () => {
  const apiPath = "services/cards/user";
  // Prosimy o konkretne pola zdefiniowane w dokumentacji 'services/cards/card'
  const fields =
    "id|type|barcode_number|student_number|expiration_date|date_of_issue";

  const {
    data: cards,
    loading,
    error,
  } = useUsosApi<UsosCard[]>(apiPath, fields);

  // Funkcja pomocnicza do wyboru ikony na podstawie typu karty
  const getCardIcon = (type: string) => {
    switch (type) {
      case "student":
        return <PiStudentBold />;
      case "phd":
        return <FaUserGraduate />;
      case "staff":
      case "academic_teacher":
        return <FaChalkboardTeacher />;
      default:
        return <FaIdCard />;
    }
  };

  // Funkcja pomocnicza do tłumaczenia typu karty
  const formatCardType = (type: string): string => {
    switch (type) {
      case "student":
        return "Legitymacja studencka";
      case "phd":
        return "Legitymacja doktorancka";
      case "staff":
        return "Karta pracownicza";
      case "academic_teacher":
        return "Karta nauczyciela";
      default:
        return "Karta ID";
    }
  };

  // Funkcja pomocnicza do formatowania daty
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "brak";
    try {
      return new Date(dateString).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "błędna data";
    }
  };

  // Sprawdza, czy karta straciła ważność
  const isExpired = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false; // Nie można określić
    return new Date(dateString) < new Date();
  };

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie Twoich kart...</p>;
  } else if (error) {
    content = <p className={styles.error}>Błąd ładowania kart: {error}</p>;
  } else if (cards && cards.length > 0) {
    content = (
      <ul className={styles.cardList}>
        {cards.map((card) => {
          const expired = isExpired(card.expiration_date);
          return (
            <li
              key={card.id}
              className={`${styles.cardItem} ${styles[card.type] || ""} ${
                expired ? styles.expired : ""
              }`}
            >
              <div className={styles.cardIcon}>{getCardIcon(card.type)}</div>
              <div className={styles.cardDetails}>
                <span className={styles.cardType}>
                  {formatCardType(card.type)}
                </span>
                {card.student_number && (
                  <span className={styles.cardInfo}>
                    Nr albumu: {card.student_number}
                  </span>
                )}
                {card.barcode_number && (
                  <span className={styles.cardInfo}>
                    Kod kreskowy: {card.barcode_number}
                  </span>
                )}
                <span className={styles.cardDate}>
                  Ważna do: {formatDate(card.expiration_date)}
                  {expired && <strong> (NIEWAŻNA)</strong>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  } else {
    content = <p>Nie znaleziono żadnych aktywnych legitymacji.</p>;
  }

  return <Card title="Twoje Legitymacje i Karty">{content}</Card>;
};

export default IdCardsWidget;
