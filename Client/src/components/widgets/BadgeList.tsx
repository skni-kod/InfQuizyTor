import { Panel } from "../common/Panel";
import { IconStar } from "../../assets/icons"; // Poprawiony import
import styles from "./BadgeList.module.css";

// Mock data z obrazka
const badges = [
  { id: 1, name: "Mistrz Algebry", icon: "🌟" }, // Użyjmy emoji dla prostoty
  { id: 2, name: "Demon Szybkości (Fizyka)", icon: "⚡️" },
  { id: 3, name: "Pomocnik", icon: "💡" },
];

export const BadgeList = () => {
  return (
    <Panel className={styles.widgetCard}>
      <h2 className={styles.title}>
        <IconStar />
        <span>Ostatnie Osiągnięcia</span>
      </h2>
      <ul className={styles.list}>
        {badges.map((badge) => (
          <li key={badge.id} className={styles.badgeItem}>
            <span className={styles.badgeIcon}>{badge.icon}</span>
            <span className={styles.badgeName}>{badge.name}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
