// src/components/layout/Header.tsx
import { NavLink } from "react-router-dom";
import { IconHome, IconGraph, IconUsers, IconUser } from "../../assets/icons";
import styles from "./Header.module.css";
import { cn } from "../../utils/cn";

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>InfQuizyTor</div>

      <nav className={styles.navList}>
        {/* ...linki nawigacji (bez zmian)... */}
      </nav>

      {/* POPRAWKA: Używamy klasy CSS zamiast stylu inline */}
      <div className={styles.spacer} />

      <NavLink
        to="/profil"
        className={({ isActive }) =>
          cn(styles.profileLink, isActive && styles.active)
        }
      >
        <IconUser />
        <span>Mój Profil</span>
      </NavLink>
    </header>
  );
};
