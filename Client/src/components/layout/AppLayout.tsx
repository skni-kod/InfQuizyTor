import { Outlet } from "react-router-dom";
// import { Sidebar } from './Sidebar'; <-- Usuń to
import { Header } from "./Header"; // <-- Dodaj to
import styles from "./AppLayout.module.css";

export const AppLayout = () => {
  return (
    <div className={styles.appLayout}>
      {/* <Sidebar /> <-- Usuń to */}
      <Header /> {/* <-- Dodaj to */}
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};
