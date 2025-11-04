import { useAppContext } from "../contexts/AppContext"; // Importuj kontekst
import styles from "./ProfilePage.module.scss"; // Stwórz ten plik

const ProfilePage = () => {
  const { user, authLoading } = useAppContext();

  // 1. Stan ładowania (gdy App.tsx wciąż sprawdza sesję)
  if (authLoading) {
    return <div className={styles.loading}>Ładowanie profilu...</div>;
  }

  // 2. Stan "Nie zalogowany"
  if (!user) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loginRequired}>
          <h1>Dostęp zabroniony</h1>
          <p>Musisz być zalogowany, aby zobaczyć tę stronę.</p>
          <a
            href="http://localhost:8080/auth/usos/login"
            className={styles.loginButton}
          >
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  // 3. Stan "Zalogowany"
  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <h1>Witaj, {user.first_name}!</h1>
        <p>Oto Twój profil.</p>
      </header>

      <div className={styles.profileDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Imię</span>
          <span className={styles.detailValue}>{user.first_name}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Nazwisko</span>
          <span className={styles.detailValue}>{user.last_name}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue}>{user.email || "Brak"}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>USOS ID</span>
          <span className={styles.detailValue}>{user.id}</span>
        </div>
      </div>

      {/* Tutaj możesz dodać komponent <Badge /> */}
      <div className={styles.badgesSection}>
        <h3>Twoje Odznaki</h3>
        <p>(Wkrótce...)</p>
        {/* <Badge text="Weteran" variant="primary" /> */}
      </div>
    </div>
  );
};

export default ProfilePage;
