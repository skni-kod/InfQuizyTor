// components/Dashboard/Dashboard.tsx
import { Leaderboard } from "../Leaderboard/Leaderboard";
import { BadgeList } from "../BadgeList/BadgeList";
import { QuantumGraph } from "../QuantumGraph/QuantumGraph";
import styles from "./Dashboard.module.css";

export const Dashboard = () => {
  return (
    <main className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <Leaderboard />
        <BadgeList />
        {/* Można tu dodać panel "Nadchodzące Terminy" */}
      </aside>
      <section className={styles.mainContent}>
        <QuantumGraph />
      </section>
    </main>
  );
};
