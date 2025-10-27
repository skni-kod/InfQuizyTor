import { NavLink } from "react-router-dom";
import styles from "./Header.module.scss";
import { FaChartPie, FaFlask, FaUsers, FaUserCircle } from "react-icons/fa";

const Header = () => {
  return (
    <header className={styles.header}>
      {" "}
      {/* [cite: 114] */}
      <div className={styles.logo}>InfQuizyTor</div>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <FaChartPie />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/przedmioty"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <FaFlask />
          <span>Przedmioty</span>
        </NavLink>
        <NavLink
          to="/community"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <FaUsers />
          <span>Społeczność</span>
        </NavLink>
        <NavLink
          to="/profil"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <FaUserCircle />
          <span>Profil</span>
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;
