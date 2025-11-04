import React from "react";
import styles from "./Card.module.scss"; // Importujemy style

// Definiujemy typy dla propsów komponentu
interface CardProps {
  /**
   * Zawartość, która ma być wyświetlona wewnątrz karty.
   */
  children: React.ReactNode;

  /**
   * Opcjonalny tytuł, który pojawi się na górze karty.
   */
  title?: string;

  /**
   * Opcjonalne dodatkowe klasy CSS do stylizacji z zewnątrz.
   */
  className?: string;

  /**
   * Opcjonalna funkcja, która zostanie wywołana po kliknięciu karty.
   */
  onClick?: () => void;
}

/**
 * Uniwersalny komponent Card do wyświetlania treści w ramce.
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  className = "",
  onClick,
}) => {
  // Łączymy domyślne klasy z dodatkowymi klasami z propsów
  const cardClasses = [
    styles.card, // Domyślny styl z pliku SCSS
    className, // Dodatkowe klasy przekazane z zewnątrz
    onClick ? styles.clickable : "", // Dodaj klasę 'clickable', jeśli karta ma onClick
  ]
    .filter(Boolean) // Usuń puste wpisy
    .join(" "); // Połącz spacjami

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Warunkowo renderuj tytuł, jeśli został podany */}
      {title && <h3 className={styles.cardTitle}>{title}</h3>}

      {/* Główna zawartość karty */}
      <div className={styles.cardContent}>{children}</div>
    </div>
  );
};

export default Card;
