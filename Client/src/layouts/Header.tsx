import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Header.module.scss";
import {
  FaChartPie,
  FaFlask,
  FaUsers,
  FaUserCircle,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAppContext } from "../contexts/AppContext";

const BACKEND_URL = "http://localhost:8080";

const Header = () => {
  const { authState, setUser } = useAppContext();
  const navigate = useNavigate();

  // --- POPRAWKA 1: Dodajemy funkcję handleLogin ---
  const handleLogin = async () => {
    try {
      // 1. Wyślij żądanie do backendu
      const response = await fetch(`${BACKEND_URL}/auth/usos/login`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        // 2. Odbierz JSON (ten, który widziałeś na zrzucie ekranu)
        const data = await response.json();

        // 3. Sprawdź, czy JSON zawiera URL i przekieruj przeglądarkę
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          console.error("Błąd: Backend nie zwrócił 'authorization_url'.");
        }
      } else {
        console.error("Błąd serwera podczas inicjowania logowania.");
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
    }
  };
  // --- KONIEC POPRAWKI 1 ---

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/usos/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Błąd sieci podczas wylogowywania:", error);
    }
    setUser(null);
    navigate("/");
  };

  const renderAuthButton = () => {
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

    // --- POPRAWKA 2: Zmieniamy <a> na <button> ---
    // Wylogowany
    return (
      <button onClick={handleLogin} className={styles.navLink}>
        <FaSignInAlt />
        <span>Zaloguj się</span>
      </button>
    );
    // --- KONIEC POPRAWKI 2 ---
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
