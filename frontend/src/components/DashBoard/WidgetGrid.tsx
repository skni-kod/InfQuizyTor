import { Responsive, WidthProvider } from "react-grid-layout";
import { useAppContext } from "../../contexts/AppContext";
import Widget from "../Widgets/Widget";
import Menu from "../Menu/Menu";
import styles from "./WidgetGrid.module.scss";

// Import stylów RGL (React-Grid-Layout)
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css"; // Upewnij się, że masz zainstalowane 'react-resizable'

const ResponsiveGridLayout = WidthProvider(Responsive);

const WidgetGrid = () => {
  const { isMenuOpen } = useAppContext();

  // --- NOWY, SYMETRYCZNY UKŁAD KAFELKÓW ---
  const layouts = {
    lg: [
      // Górny rząd
      { i: "upcoming", x: 0, y: 0, w: 5, h: 2 }, // Lewy górny
      { i: "menu", x: 5, y: 0, w: 2, h: 2, static: true }, // ŚRODEK
      { i: "progress", x: 7, y: 0, w: 5, h: 2 }, // Prawy górny

      // Dolny rząd
      { i: "leaderboard", x: 0, y: 2, w: 6, h: 3 }, // Lewy dolny
      { i: "achievements", x: 6, y: 2, w: 6, h: 3 }, // Prawy dolny
    ],
    // Należy również zdefiniować layouty dla md, sm, xs...
    md: [
      { i: "upcoming", x: 0, y: 0, w: 5, h: 2 },
      { i: "menu", x: 5, y: 0, w: 2, h: 2, static: true },
      { i: "progress", x: 7, y: 0, w: 5, h: 2 },
      { i: "leaderboard", x: 0, y: 2, w: 6, h: 3 },
      { i: "achievements", x: 6, y: 2, w: 6, h: 3 },
    ],
  };
  // --- KONIEC NOWEGO UKŁADU ---

  const gridClasses = `${styles.widgetGrid} ${
    isMenuOpen ? styles.menuIsOpen : ""
  }`;

  return (
    <ResponsiveGridLayout
      className={gridClasses}
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }} // Ustawiamy 12 kolumn dla md
      rowHeight={120} // Zwiększamy wysokość rzędu dla lepszych proporcji
      margin={[20, 20]} // Zwiększamy margines
      isDraggable={!isMenuOpen}
      isResizable={!isMenuOpen}
      // Zapobiega kolizjom widgetów przy przeciąganiu
      preventCollision={true}
    >
      <div key="upcoming">
        <Widget title="Najbliższe Terminy">Treść widgetu...</Widget>
      </div>
      <div key="progress">
        <Widget title="Postępy w Nauce">Treść widgetu...</Widget>
      </div>
      <div key="leaderboard">
        <Widget title="Ranking">Treść widgetu...</Widget>
      </div>
      <div key="achievements">
        <Widget title="Osiągnięcia">Treść widgetu...</Widget>
      </div>

      <div key="menu" className={styles.GridItem}>
        <Menu />
      </div>
    </ResponsiveGridLayout>
  );
};

export default WidgetGrid;
