import { NavLink } from "react-router-dom";
import styles from "./Header.module.scss";
import {
  FaChartPie,
  FaFlask,
  FaUsers,
  FaUserCircle,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAppContext } from "../contexts/AppContext"; // Importuj kontekst

// Definiujemy adres URL backendu (port 8080)
const BACKEND_URL = "http://localhost:8080";

const Header = () => {
  // --- POPRAWKA ---
  // Odczytujemy 'authState' zamiast 'user' i 'authLoading'
  const { authState, setUser } = useAppContext();
  // --- KONIEC POPRAWKI ---

  const handleLogout = async () => {
    try {
      // Zmieniamy na POST, aby pasowało do main.go
      const response = await fetch(`${BACKEND_URL}/auth/usos/logout`, {
        method: "POST", // Użyj POST
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        // Przeładuj stronę, aby wyczyścić stan
        window.location.href = "/"; // Bezpieczniejsze niż reload()
      } else {
        const errorData = await response.json();
        console.error("Błąd wylogowania:", errorData.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd sieci podczas wylogowywania:", error);
    }
  };

  const renderAuthButton = () => {
    // --- POPRAWKA ---
    if (authState.authLoading) {
      return (
        <button className={styles.navButton} disabled>
          ...
        </button>
      );
    }

    if (authState.user) {
      return (
        <>
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <FaUserCircle />
            {/* Używamy authState.user */}
            <span>{authState.user.first_name || "Profil"}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className={`${styles.navLink} ${styles.logoutButton}`}
          >
            <FaSignOutAlt />
            <span>Wyloguj</span>
          </button>
        </>
      );
    }
    // --- KONIEC POPRAWKI ---

    // Wylogowany
    return (
      <a href={`${BACKEND_URL}/auth/usos/login`} className={styles.navLink}>
        <FaSignInAlt />
        <span>Zaloguj się</span>
      </a>
    );
  };

  return (
    <header className={styles.header}>
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

        <div className={styles.authControls}>{renderAuthButton()}</div>
      </nav>
    </header>
  );
};

export default Header;
