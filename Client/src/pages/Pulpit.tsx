import { useAppContext } from "../context/AppContext";
import { QuantumGraph } from "../components/QuantumGraph/QuantumGraph";
import { WidgetGrid } from "../components/layout/WidgetGrid";
import styles from "./Pulpit.module.css";

export const Pulpit = () => {
  const { user } = useAppContext();
  const userName = user?.name.split("_")[0] || "Student";

  return (
    // Ten kontener używa position: relative
    <div className={styles.pulpitContainer}>
      {/* TŁO: Graf jest absolutnie pozycjonowany z tyłu */}
      <div className={styles.graphBackground}>
        <QuantumGraph />
      </div>

      {/* OVERLAY: Widżety są absolutnie pozycjonowane z przodu */}
      <div className={styles.widgetOverlay}>
        <h1 className={styles.title}>Witaj {userName}, oto Twój dzień!</h1>
        <WidgetGrid />
      </div>
    </div>
  );
};
