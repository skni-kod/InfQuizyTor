import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import Menu from "../components/Menu/Menu";
import EctsCreditsWidget from "../components/Widgets/EctsCreditsWidget";
import LatestGradesWidget from "../components/Widgets/LatestGradesWidget";
import UserCoursesWidget from "../components/Widgets/UserCoursesWidget";
import StudentTestsWidget from "../components/Widgets/StudentTestsWidget";
import IdCardsWidget from "../components/Widgets/IdCardsWidget";
import BuildingIndexWidget from "../components/Widgets/BuildingIndexWidget";

import styles from "./DashboardPage.module.scss";
import dashboardBackgroundUrl from "../assets/Bez tytułu.png";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardPage = () => {
  const { isMenuOpen } = useAppContext();

  // --- UKŁAD SIATKI (12 KOLUMN) ---
  const defaultLayouts = {
    lg: [
      // MENU NA ŚRODKU (Statyczne) x:4, w:4
      { i: "menu", x: 4, y: 1, w: 4, h: 4, static: true },
      // Widgety dookoła
      { i: "courses", x: 0, y: 0, w: 4, h: 4 },
      { i: "grades", x: 8, y: 0, w: 4, h: 4 },
      { i: "tests", x: 0, y: 4, w: 4, h: 4 },
      { i: "buildings", x: 8, y: 4, w: 4, h: 4 },
      { i: "cards", x: 4, y: 0, w: 4, h: 1 },
      { i: "ects", x: 4, y: 5, w: 4, h: 2 },
    ],
    md: [
      { i: "menu", x: 2, y: 1, w: 4, h: 4, static: true },
      { i: "courses", x: 0, y: 0, w: 4, h: 4 },
      { i: "grades", x: 4, y: 0, w: 4, h: 4 },
      // ... reszta
    ],
  };

  const [layouts, setLayouts] = useState(defaultLayouts);

  const onLayoutChange = (_: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  return (
    <div
      className={`${styles.dashboardContainer} ${
        isMenuOpen ? styles.menuOpen : ""
      }`}
      style={
        {
          "--bg-image-url": `url(${dashboardBackgroundUrl})`,
        } as React.CSSProperties
      }
    >
      <ResponsiveGridLayout
        className={styles.layout}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        margin={[20, 20]}
        // Wyłączamy interakcję z gridem (przesuwanie), gdy menu otwarte
        isDraggable={!isMenuOpen}
        isResizable={!isMenuOpen}
        draggableHandle=".widgetHeader"
        onLayoutChange={onLayoutChange}
      >
        {/* WIDGETY */}
        <div key="courses">
          <UserCoursesWidget />
        </div>
        <div key="grades">
          <LatestGradesWidget />
        </div>
        <div key="tests">
          <StudentTestsWidget />
        </div>
        <div key="ects">
          <EctsCreditsWidget />
        </div>
        <div key="cards">
          <IdCardsWidget />
        </div>
        <div key="buildings">
          <BuildingIndexWidget />
        </div>

        {/* MENU - Kluczowe: dodajemy klasę 'static-menu' do className */}
        <div key="menu" className={`${styles.menuWrapper} static-menu`}>
          <Menu />
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardPage;
