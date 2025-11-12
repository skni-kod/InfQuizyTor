import { NavLink, useNavigate } from "react-router-dom"; // 1. Zaimportuj useNavigate
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

const BACKEND_URL = "http://localhost:8080";

const Header = () => {
  // Poprawione, aby używać authState
  const { authState, setUser } = useAppContext();
  const navigate = useNavigate(); // 2. Zainicjuj hook nawigacji

  // Poprawiona funkcja wylogowywania
  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/usos/logout`, {
        method: "POST", // Upewnij się, że jest POST
        credentials: "include",
      });
      // Nie obchodzi nas, czy odpowiedź to 200 OK, czy 401.
      // Czekaliśmy na odpowiedź, więc serwer miał szansę wysłać polecenie usunięcia ciasteczka.
    } catch (error) {
      console.error("Błąd sieci podczas wylogowywania:", error);
      // Jeśli serwer nie odpowiada, i tak wylogowujemy lokalnie.
    }

    // --- POPRAWKA ---
    // Te dwie linie są teraz wykonywane PO otrzymaniu odpowiedzi od serwera
    setUser(null); // Wyczyść stan w React
    navigate("/"); // 3. Użyj 'navigate' ZAMIAST 'window.location.reload()'
    // --- KONIEC POPRAWKI ---
  };

  const renderAuthButton = () => {
    // Użyj authState
    if (authState.authLoading) {
      return (
        <button className={styles.navButton} disabled>
          ...
        </button>
      );
    }

    // Użyj authState
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
