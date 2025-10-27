import GridLayout from "react-grid-layout";
import { Leaderboard } from "../widgets/Leaderboard";
import { BadgeList } from "../widgets/BadgeList";
import { UpcomingEvents } from "../widgets/UpcomingEvents";
import { ContinueLearning } from "../widgets/ContinueLearning";
import styles from "./WidgetGrid.module.css";

// To jest nasz komponent-wrapper dla widżetów w siatce
const GridItem = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.widgetItem}>{children}</div>;
};

export const WidgetGrid = () => {
  // Definicja domyślnego layoutu dla `react-grid-layout`
  // {i: 'klucz', x: pozycjaX, y: pozycjaY, w: szerokość, h: wysokość}
  const layout = [
    { i: "terminy", x: 0, y: 0, w: 6, h: 5 },
    { i: "nauka", x: 0, y: 5, w: 6, h: 4 },
    { i: "ranking", x: 6, y: 0, w: 3, h: 7 },
    { i: "osiagniecia", x: 6, y: 7, w: 3, h: 4 },
  ];

  return (
    <GridLayout
      className={styles.widgetGrid}
      layout={layout}
      cols={9} // Dzielimy ekran na 9 kolumn
      rowHeight={50} // Wysokość jednego "h"
      width={1200} // Domyślna szerokość (RGL tego wymaga)
      isDraggable={true}
      isResizable={true}
    >
      <div key="terminy">
        <GridItem>
          <UpcomingEvents />
        </GridItem>
      </div>
      <div key="nauka">
        <GridItem>
          <ContinueLearning />
        </GridItem>
      </div>
      <div key="ranking">
        <GridItem>
          <Leaderboard />
        </GridItem>
      </div>
      <div key="osiagniecia">
        <GridItem>
          <BadgeList />
        </GridItem>
      </div>
    </GridLayout>
  );
};
