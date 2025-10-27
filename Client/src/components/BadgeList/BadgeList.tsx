// components/BadgeList/BadgeList.tsx
import { Panel } from "../common/Panel";
import { IconBadge, IconAtom } from "../../assets/icons";
import styles from "./BadgeList.module.css";

// Mock data
const badges = [
  {
    id: 1,
    name: "Mistrz Algebry",
    icon: <IconBadge />,
    color: "var(--tertiary)",
  },
  {
    id: 2,
    name: "Demon Fizyki",
    icon: <IconAtom />,
    color: "var(--secondary)",
  },
  { id: 3, name: "Pomocnik", icon: <IconBadge />, color: "var(--info)" },
  { id: 4, name: "Weteran", icon: <IconBadge />, color: "var(--success)" },
];

export const BadgeList = () => {
  return (
    <Panel>
      <h2 className={styles.title}>
        <IconBadge />
        <span>Twoje Odznaki</span>
      </h2>
      <div className={styles.grid}>
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={styles.badge}
            title={badge.name}
            style={{ color: badge.color }}
          >
            {badge.icon}
            <span className="sr-only">{badge.name}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
};
