import { Outlet } from "react-router-dom";
import Header from "./Header"; // Poprawiona ścieżka (lokalna)
import styles from "./MainLayout.module.scss"; // Poprawiona ścieżka (lokalna)

const MainLayout = () => {
  return (
    <>
      <Header />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;
