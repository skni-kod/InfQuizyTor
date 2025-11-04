import React from "react";
import styles from "./Widget.module.scss";
import { FaCog } from "react-icons/fa";

interface WidgetProps {
  title: string;
  children: React.ReactNode;
}

// Ten komponent jest wrapperem na treść.
// `react-grid-layout` zajmuje się przeciąganiem i zmianą rozmiaru.
const Widget: React.FC<WidgetProps> = ({ title, children }) => {
  return (
    <div className={styles.widget}>
      {" "}
      {/* [cite: 112] */}
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>{title}</h3>
        <button className={styles.widgetButton}>
          <FaCog /> + {""}
        </button>
      </div>
      <div className={styles.widgetContent}>{children}</div>
    </div>
  );
};

export default Widget;
