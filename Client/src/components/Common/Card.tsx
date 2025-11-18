import React from "react";
import styles from "./Card.module.scss";
// Opcjonalnie ikona ustawień
import { FaCog } from "react-icons/fa";

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  // Dodaj inne propsy jeśli potrzebujesz
}

const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={`${styles.card} ${className || ""}`}>
      {/* Klasa widgetHeader jest KLUCZOWA dla przesuwania w DashboardPage */}
      <div className={`${styles.header} widgetHeader`}>
        <h3 className={styles.title}>{title}</h3>
        {/* Opcjonalny przycisk akcji */}
        {/* <button className={styles.actionBtn}><FaCog /></button> */}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Card;
