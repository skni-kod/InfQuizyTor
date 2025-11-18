import React from "react";
import { useAppContext } from "../contexts/AppContext";
import styles from "./ApiPage.module.scss";

// Importuj TYLKO POPRAWNE widgety
import GeminiTestPlayground from "../components/Widgets/GeminiTestPlayground";
// Lista POPRAWIONYCH widgetów
const widgets: React.FC[] = [
  GeminiTestPlayground,
  // TestsCard i GradesCard (stare) zostały usunięte
];

const TestsPage: React.FC = () => {
  // --- POPRAWKA ---
  const { authState } = useAppContext();
  // --- KONIEC POPRAWKI ---

  // --- POPRAWKA ---
  if (authState.authLoading) {
    return (
      <div className={styles.loadingContainer}>Ładowanie aplikacji...</div>
    );
  }

  if (!authState.user) {
    // --- KONIEC POPRAWKI ---
    return (
      <div className={styles.loadingContainer}>
        <h2>Witaj w InfQuizyTor!</h2>
        <p>Zaloguj się przez USOS, aby uzyskać dostęp do swoich danych.</p>
      </div>
    );
  }

  // Użytkownik jest zalogowany
  return (
    <div className={styles.pageContainer}>
      <h1>Twój Panel USOS</h1>

      <div className={styles.dashboardGrid}>
        {widgets.map((Widget, index) => (
          <Widget key={index} />
        ))}
      </div>
    </div>
  );
};

export default TestsPage;
