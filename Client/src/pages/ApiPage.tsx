import React from "react";
import { useAppContext } from "../contexts/AppContext";
import styles from "./ApiPage.module.scss";

// Importuj TYLKO POPRAWNE widgety
import UserCard from "../components/Widgets/UserCard";
import StudentTestsWidget from "../components/Widgets/StudentTestsWidget";
import UserCoursesWidget from "../components/Widgets/UserCoursesWidget";
import IdCardsWidget from "../components/Widgets/IdCardsWidget";
import EctsCreditsWidget from "../components/Widgets/EctsCreditsWidget";
import UsosCalendar from "../components/Calendar/UsosCalendar";
import LatestGradesWidget from "../components/Widgets/LatestGradesWidget";

// Lista POPRAWIONYCH widgetów
const widgets: React.FC[] = [
  UserCard,
  LatestGradesWidget, // Poprawny widget ocen
  StudentTestsWidget, // Poprawny widget sprawdzianów
  UserCoursesWidget,
  IdCardsWidget,
  EctsCreditsWidget,
  UsosCalendar,
  // TestsCard i GradesCard (stare) zostały usunięte
];

const ApiPage: React.FC = () => {
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

export default ApiPage;
