// components/Leaderboard/Leaderboard.tsx
import { Panel } from "../common/Panel";
import { IconCrown } from "../../assets/icons";
import styles from "./Leaderboard.module.css";
import { cn } from "../../utils/cn";

// Mock data
const topStudents = [
  { id: 1, name: "Student_Rakieta", score: 9850, isUser: false },
  { id: 2, name: "MistrzCałek_v2", score: 9720, isUser: false },
  { id: 3, name: "Ja", score: 8500, isUser: true },
  { id: 4, name: "Fizyczny_Swir", score: 8100, isUser: false },
  { id: 5, name: "JS_Enjoyer", score: 7600, isUser: false },
];

export const Leaderboard = () => {
  return (
    <Panel className={styles.leaderboardPanel}>
      <h2 className={styles.title}>
        <IconCrown />
        <span>Ranking Ogólny</span>
      </h2>
      <ol className={styles.list}>
        {topStudents.map((student, index) => (
          <li
            key={student.id}
            className={cn(styles.listItem, student.isUser && styles.user)}
          >
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.name}>{student.name}</span>
            <span className={styles.score}>{student.score} XP</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
};
