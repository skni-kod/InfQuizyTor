import { Panel } from "../common/Panel";
import { IconCrown } from "../../assets/icons";
import styles from "./Leaderboard.module.css";
import { cn } from "../../utils/cn"; // Upewnij się, że ścieżka jest poprawna

// Mock data
const topStudents = [
  { id: 1, name: "Anna N.", score: 12500, isUser: false },
  { id: 2, name: "Ty", score: 11800, isUser: true },
  { id: 3, name: "Paweł K.", score: 11750, isUser: false },
];

export const Leaderboard = () => {
  return (
    <Panel className={styles.widgetCard}>
      <h2 className={styles.title}>
        <IconCrown />
        <span>Ranking Tygodnia</span>
      </h2>
      <div className={styles.subtitle}>Quiz: Algebra - Macierze</div>
      <ol className={styles.list}>
        {topStudents.map((student, index) => (
          <li
            key={student.id}
            className={cn(styles.listItem, student.isUser && styles.user)}
          >
            <span className={styles.rank}>{index + 1}.</span>
            <span className={styles.name}>{student.name}</span>
            <span className={styles.score}>{student.score} pkt</span>
          </li>
        ))}
      </ol>
      <button className={styles.actionButton}>Popraw wynik!</button>
    </Panel>
  );
};
