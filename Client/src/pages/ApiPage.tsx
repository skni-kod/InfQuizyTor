import React from "react";

// Importowanie kontekstu, aby strona wiedziała, czy użytkownik jest zalogowany
import { useAppContext } from "../contexts/AppContext";

// Importowanie stylów dla siatki
import styles from "./ApiPage.module.scss";

// Importowanie istniejących komponentów (Widgetów)
// Zakładam, że masz je w folderze 'src/components/Widgets'
// import UsosCalendar from "../components/Calendar/UsosCalendar"; // Istniejący kalendarz
import UserCard from "../components/Widgets/UserCard"; // Karta z danymi użytkownika
import GradeCard from "../components/Widgets/GradeCard"; // Karta z ocenami
import TestsCard from "../components/Widgets/TestsCard"; // Karta ze sprawdzianami

/**
 * Strona główna (Dashboard) wyświetlająca wszystkie dane pobrane z API USOS.
 */
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
        {/* Karta z danymi użytkownika (zajmuje 1 komórkę) */}
        <div className={`${styles.gridItem} ${styles.userCard}`}>
          <UserCard />
        </div>

        {/* Karta z kalendarzem (zajmuje 2 komórki szerokości i 2 wysokości) */}
        {/* <div className={`${styles.gridItem} ${styles.calendarCard}`}>
          <UsosCalendar />
        </div> */}

        {/* Karta z ocenami (zajmuje 1 komórkę) */}
        <div className={`${styles.gridItem} ${styles.gradesCard}`}>
          <GradeCard />
        </div>

        {/* Karta ze sprawdzianami (zajmuje 1 komórkę) */}
        <div className={`${styles.gridItem} ${styles.testsCard}`}>
          <TestsCard />
        </div>
      </div>
    </div>
  );
};

export default ApiPage;
