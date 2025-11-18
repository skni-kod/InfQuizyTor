import React, { forwardRef } from "react";
import styles from "./Widget.module.scss";
import { FaCog } from "react-icons/fa";

interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
}

const Widget = forwardRef<HTMLDivElement, WidgetProps>(
  ({ title, children, style, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={style} // RGL zarządza pozycją tego diva
        className={`${styles.widgetContainer} ${className || ""}`}
        {...props}
      >
        {/* Dodajemy klasę 'widget-inner' do animacji CSS */}
        <div className={`widget-inner ${styles.widget}`}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>{title}</h3>
            <button className={styles.widgetButton}>
              <FaCog />
            </button>
          </div>
          <div className={styles.widgetContent}>{children}</div>
        </div>
      </div>
    );
  }
);

export default Widget;
