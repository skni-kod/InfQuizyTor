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
  // Pobierz stan użytkownika i ładowania
  const { user, authLoading, setUser } = useAppContext();

  // Funkcja wylogowywania
  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/usos/logout`, {
        // Użyj metody GET (tak jak ustawiłeś w main.go)
        method: "GET",
        credentials: "include", // Niezbędne do wysłania ciasteczka sesji
      });

      if (response.ok) {
        // --- KLUCZOWE POPRAWKI ---
        // 1. Zaktualizuj stan globalny (powiedz Reactowi, że nikt nie jest zalogowany)
        setUser(null);
        // 2. Przeładuj stronę, aby wyczyścić wszystko i uruchomić checkAuthStatus
        window.location.reload();
        // (Alternatywnie: navigate('/'), ale reload jest pewniejszy)
        // --- KONIEC POPRAWEK ---
      } else {
        const errorData = await response.json();
        console.error("Błąd wylogowania:", errorData.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd sieci podczas wylogowywania:", error);
    }
  };

  // Renderowanie przycisku Logowania/Wylogowania
  const renderAuthButton = () => {
    // Jeśli App.tsx wciąż sprawdza sesję, pokaż spinner
    if (authLoading) {
      return (
        <button className={styles.navButton} disabled>
          ...
        </button>
      );
    }

    // Jeśli użytkownik jest zalogowany
    if (user) {
      return (
        <>
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <FaUserCircle />
            {/* Pokaż imię użytkownika, jeśli istnieje */}
            <span>{user.first_name || "Profil"}</span>
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

    // Jeśli użytkownik jest wylogowany
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

        {/* Dynamiczny blok autoryzacji */}
        <div className={styles.authControls}>{renderAuthButton()}</div>
      </nav>
    </header>
  );
};

export default Header;
