import React from "react";
import { useAppContext } from "../contexts/AppContext";
import styles from "./ApiPage.module.scss";

// 1. IMPORTUJ NOWE MENU
import TopicViewerModal from "../components/Studio/TopicViewerModal"; // Import modala
import { Topic } from "../assets/types"; // Importuj Topic

// Importuj swoje widgety
import UserCard from "../components/Widgets/UserCard";
import LatestGradesWidget from "../components/Widgets/LatestGradesWidget";
import StudentTestsWidget from "../components/Widgets/StudentTestsWidget";
import UserCoursesWidget from "../components/Widgets/UserCoursesWidget";
import IdCardsWidget from "../components/Widgets/IdCardsWidget";
import EctsCreditsWidget from "../components/Widgets/EctsCreditsWidget";
import CustomGroupsWidget from "../components/Widgets/CustomGroupsWidget";
import BuildingIndexWidget from "../components/Widgets/BuildingIndexWidget";
import UsosGroups from "../components/Widgets/UsosGroups";
// import CalendarContainer from "../components/Calendar/CalendarContainer";

const widgets: React.FC[] = [
  UserCard,
  LatestGradesWidget,
  StudentTestsWidget,
  UserCoursesWidget,
  IdCardsWidget,
  EctsCreditsWidget,
  CustomGroupsWidget,
  BuildingIndexWidget,
  UsosGroups,
  // CalendarContainer,
];

const ApiPage: React.FC = () => {
  // 2. POBIERZ STAN GOOEY MENU
  const { authState, isGooeyMenuOpen } = useAppContext();

  // Stan dla modala (jest tutaj, bo GooeyMenu i QuizGraph go potrzebują)
  const [viewingTopic, setViewingTopic] = React.useState<Topic | null>(null);

  if (authState.authLoading) {
    return (
      <div className={styles.loadingContainer}>Ładowanie aplikacji...</div>
    );
  }

  if (!authState.user) {
    return (
      <div className={styles.loadingContainer}>
        <h2>Witaj w InfQuizyTor!</h2>
        <p>Zaloguj się przez USOS, aby uzyskać dostęp do swoich danych.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 3. DODAJ KOMPONENTY (będą pływać nad wszystkim) */}

      <TopicViewerModal
        topic={viewingTopic}
        onClose={() => setViewingTopic(null)}
      />

      <h1>Twój Panel USOS</h1>

      {/* 4. DODAJ KLASĘ WARUNKOWĄ DO SIATKI WIDGETÓW */}
      <div
        className={`${styles.dashboardGrid} ${
          isGooeyMenuOpen ? styles.isHidden : ""
        }`}
      >
        {widgets.map((Widget, index) => (
          <Widget key={index} />
        ))}
      </div>
    </div>
  );
};

export default ApiPage;
