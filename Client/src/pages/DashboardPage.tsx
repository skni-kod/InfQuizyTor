import { useAppContext } from "../contexts/AppContext";
import Menu from "../components/Menu/Menu"; // Import the renamed Menu
import Widget from "../components/Widgets/Widget";
import styles from "./DashboardPage.module.scss"; // Create this SCSS file
import { UpcomingEvent, RankingEntry, LearningProgress } from "../assets/types"; // Import new types
import SplineBackground from "../components/Background/SplineBackground";
import dashboardBackgroundUrl from "../assets/Bez tytułu.png";
// --- Mock Data ---
const mockEvents: UpcomingEvent[] = [
  {
    id: "e1",
    type: "Wykład",
    title: "Analiza Matematyczna",
    time: "10:00-11:30",
    source: "USOS",
    color: "var(--primary)",
  },
  {
    id: "e2",
    type: "Wejściówka",
    title: "Algebra",
    time: "14:00",
    source: "GRUPA C-1",
    color: "var(--error)",
  },
  {
    id: "e3",
    type: "Spotkanie",
    title: "Koła Naukowego AI",
    time: "18:00",
    source: "SEKCJA AI",
    color: "var(--warning)",
  },
  {
    id: "e4",
    type: "Nauka",
    title: "Fiszki - Pochodne",
    time: "21:00",
    source: "PRYWATNE",
    color: "var(--success)",
  },
];

const mockRanking: RankingEntry[] = [
  { rank: 1, name: "Anna N.", score: 12500 },
  { rank: 2, name: "Ty", score: 11800, isCurrentUser: true },
  { rank: 3, name: "Paweł K.", score: 11750 },
];

const mockProgress: LearningProgress = {
  subject: "Analiza Matematyczna",
  topic: "Pochodne",
  progress: 80,
  required: 80,
};
// --- End Mock Data ---

const DashboardPage = () => {
  const { isMenuOpen } = useAppContext(); // State controls animations

  // Define widget positions for the hexagon (adjust radius/offsets as needed)
  const radius = 300; // Distance from center
  const widgetPositions = [
    {
      top: `calc(50% - ${radius}px)`,
      left: "50%",
      transform: "translate(-50%, -50%)",
    }, // Top
    {
      top: `calc(50% - ${radius / 2}px)`,
      left: `calc(50% + ${radius * 0.866}px)`,
      transform: "translate(-50%, -50%)",
    }, // Top-right
    {
      top: `calc(50% + ${radius / 2}px)`,
      left: `calc(50% + ${radius * 0.866}px)`,
      transform: "translate(-50%, -50%)",
    }, // Bottom-right
    {
      top: `calc(50% + ${radius}px)`,
      left: "50%",
      transform: "translate(-50%, -50%)",
    }, // Bottom
    {
      top: `calc(50% + ${radius / 2}px)`,
      left: `calc(50% - ${radius * 0.866}px)`,
      transform: "translate(-50%, -50%)",
    }, // Bottom-left
    {
      top: `calc(50% - ${radius / 2}px)`,
      left: `calc(50% - ${radius * 0.866}px)`,
      transform: "translate(-50%, -50%)",
    }, // Top-left
  ];

  return (
    <div
      className={styles.dashboardContainer}
      style={
        {
          "--bg-image-url": `url(${dashboardBackgroundUrl})`,
        } as React.CSSProperties
      }
    >
      {/* <SplineBackground /> */}

      {/* Central Menu */}
      <div className={styles.menuContainer}>
        <Menu />
      </div>

      {/* Widgets positioned absolutely */}
      {/* Upcoming Events (Top-Left) */}
      <div
        className={`${styles.widgetWrapper} ${isMenuOpen ? styles.hidden : ""}`}
        style={{ ...widgetPositions[5], transitionDelay: "0s" }}
      >
        <Widget title="Nadchodzące Terminy">
          <ul className={styles.eventList}>
            {mockEvents.map((event) => (
              <li key={event.id}>
                <span
                  className={styles.eventColor}
                  style={{ backgroundColor: event.color }}
                ></span>
                <div className={styles.eventDetails}>
                  <strong>
                    {event.type}: {event.title}
                  </strong>
                  <span>
                    {event.time} | Źródło: {event.source}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.widgetActions}>
            <button>Zobacz Pełny Kalendarz</button>
            <button>+ Dodaj Wydarzenie</button>
          </div>
        </Widget>
      </div>

      {/* Continue Learning (Bottom-Left) */}
      <div
        className={`${styles.widgetWrapper} ${isMenuOpen ? styles.hidden : ""}`}
        style={{ ...widgetPositions[4], transitionDelay: "0.1s" }}
      >
        <Widget title="Kontynuuj Naukę">
          <div className={styles.progressDetails}>
            <p>Ostatnio przerabiałeś:</p>
            <h3>
              {mockProgress.subject} - {mockProgress.topic}
            </h3>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${mockProgress.progress}%` }}
              ></div>
            </div>
            <p>
              Postęp: {mockProgress.progress}%{" "}
              {mockProgress.required &&
                `(wymagane ${mockProgress.required}% do odblokowania Całek)`}
            </p>
          </div>
        </Widget>
      </div>

      {/* Ranking (Top-Right) */}
      <div
        className={`${styles.widgetWrapper} ${isMenuOpen ? styles.hidden : ""}`}
        style={{ ...widgetPositions[1], transitionDelay: "0.2s" }}
      >
        <Widget title="Ranking Tygodnia">
          <p className={styles.rankingContext}>Quiz: Algebra - Macierze</p>
          <ol className={styles.rankingList}>
            {mockRanking.map((entry) => (
              <li
                key={entry.rank}
                className={entry.isCurrentUser ? styles.currentUser : ""}
              >
                <span>
                  {entry.rank}. {entry.name}
                </span>
                <span>{entry.score} pkt</span>
              </li>
            ))}
          </ol>
          <button className={styles.rankingAction}>Popraw wynik!</button>
        </Widget>
      </div>

      {/* Add more widgets here, assigning positions from widgetPositions */}
      {/* Example: Achievements (Bottom-Right) */}
      <div
        className={`${styles.widgetWrapper} ${isMenuOpen ? styles.hidden : ""}`}
        style={{ ...widgetPositions[2], transitionDelay: "0.3s" }}
      >
        <Widget title="Osiągnięcia">
          <p>Twoje ostatnie osiągnięcie...</p>
          {/* ... content ... */}
        </Widget>
      </div>
    </div>
  );
};

export default DashboardPage;
