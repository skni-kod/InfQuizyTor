import React from "react";

// Importowanie kontekstu, aby strona wiedziała, czy użytkownik jest zalogowany
import { useAppContext } from "../contexts/AppContext";

// Importowanie stylów dla siatki
import styles from "./ApiPage.module.scss";

// import all from widgets
import UserCard from "../components/Widgets/UserCard";
import StudentTestsWidget from "../components/Widgets/StudentTestsWidget";
import UserCoursesWidget from "../components/Widgets/UserCoursesWidget";
import IdCardsWidget from "../components/Widgets/IdCardsWidget";
import EctsCreditsWidget from "../components/Widgets/EctsCreditsWidget";
import UsosCalendar from "../components/Calendar/UsosCalendar";
import LatestGradesWidget from "../components/Widgets/LatestGradesWidget";

/**
/**
 * Strona główna (Dashboard) wyświetlająca wszystkie dane pobrane z API USOS.
 */
const widgets: React.FC[] = [
  UserCard,
  LatestGradesWidget,

  StudentTestsWidget,
  UserCoursesWidget,
  IdCardsWidget,
  EctsCreditsWidget,
  UsosCalendar,
];

const ApiPage: React.FC = () => {
  const { user, authLoading } = useAppContext();

  // Wyświetl spinner ładowania, jeśli aplikacja wciąż sprawdza status logowania
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>Ładowanie aplikacji...</div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, pokaż mu komunikat
  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Witaj w InfQuizyTor!</h2>
        <p>Zaloguj się przez USOS, aby uzyskać dostęp do swoich danych.</p>
        {/* Możesz tu dodać przycisk logowania */}
      </div>
    );
  }

  // Użytkownik jest zalogowany - wyświetl dashboard
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
