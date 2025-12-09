import React, { forwardRef, useState } from "react";
import styles from "./Widget.module.scss";
// Importujemy FaPlus i FaMinus do rozwijania/zwijania
import { FaCog, FaPlus, FaMinus } from "react-icons/fa";

interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
  // NOWE PROPSY DLA ZWIJANIA
  collapsible?: boolean; // Czy widżet ma być zwijany
  defaultCollapsed?: boolean; // Czy ma być domyślnie zwinięty
}

const Widget = forwardRef<HTMLDivElement, WidgetProps>(
  (
    {
      title,
      children,
      style,
      className,
      // Ustaw domyślne wartości
      collapsible = false,
      defaultCollapsed = false,
      ...props
    },
    ref
  ) => {
    // Stan dla zwijania (tylko jeśli jest collapsible)
    const [isCollapsed, setIsCollapsed] = useState(
      collapsible && defaultCollapsed
    );

    const toggleCollapse = () => {
      if (collapsible) {
        setIsCollapsed((prev) => !prev);
      }
    };

    // Wybór ikony: FaMinus gdy rozwinięty, FaPlus gdy zwinięty
    const CollapseIcon = isCollapsed ? FaPlus : FaMinus;

    // Decydujemy, co ma być w przycisku po prawej
    const headerButton = collapsible ? (
      <button
        // 💡 POPRAWKA: Dodajemy globalną klasę ignorującą przeciąganie RGL
        className={`${styles.widgetButton} ${styles.collapseButton} react-draggable-ignore`}
        onClick={toggleCollapse}
        title={isCollapsed ? "Rozwiń" : "Zwiń"}
      >
        <CollapseIcon />
      </button>
    ) : (
      // Oryginalny przycisk ustawień, jeśli widżet nie jest zwijany
      <button
        // 💡 POPRAWKA: Dodajemy globalną klasę ignorującą przeciąganie RGL
        className={`${styles.widgetButton} react-draggable-ignore`}
        title="Ustawienia"
      >
        <FaCog />
      </button>
    );

    return (
      <div
        ref={ref}
        style={style} // RGL zarządza pozycją tego diva
        className={`${styles.widgetContainer} ${className || ""}`}
        {...props}
      >
        {/* Dodaj klasę 'collapsed' do .widget, aby sterować stylem w CSS */}
        <div
          className={`widget-inner ${styles.widget} ${
            isCollapsed ? styles.collapsed : ""
          }`}
        >
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>{title}</h3>
            {/* Użyj zmiennej headerButton */}
            {headerButton}
          </div>
          <div className={styles.widgetContent}>{children}</div>
        </div>
      </div>
    );
  }
);

export default Widget;
