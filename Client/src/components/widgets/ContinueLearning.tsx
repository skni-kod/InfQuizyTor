// src/components/widgets/ContinueLearning.tsx
import { Panel } from "../common/Panel";
import { IconBookOpen } from "../../assets/icons";
import styles from "./Widget.module.css";

export const ContinueLearning = () => {
  const progress = "80%"; // W przyszłości ta wartość będzie dynamiczna

  return (
    <Panel className={styles.widgetCard}>
      <h2 className={styles.widgetTitle}>
        <IconBookOpen />
        <span>Kontynuuj Naukę</span>
      </h2>
      <div className={styles.learningContent}>
        <p className={styles.learningSubtitle}>Ostatnio przerabiałeś:</p>
        <h3 className={styles.learningTitle}>
          Analiza Matematyczna - Pochodne
        </h3>
        <div className={styles.progressBar}>
          {/* POPRAWKA: Używamy zmiennej CSS. Linter nadal może to flagować,
              ale jest to najlepsza praktyka. */}
          <div
            className={styles.progressFill}
            style={{ "--progress-width": progress } as React.CSSProperties}
          />
        </div>
        <p className={styles.learningMeta}>
          Postęp: {progress} (wymagane do odblokowania Całek)
        </p>
      </div>
    </Panel>
  );
};
