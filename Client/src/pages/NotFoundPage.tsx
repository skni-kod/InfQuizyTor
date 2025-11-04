import { Link } from "react-router-dom"; // Import Link for navigation
import styles from "./NotFoundPage.module.scss"; // Import styles

const NotFoundPage = () => {
  return (
    <div className={styles.notFoundContainer}>
      <h1>404 🤔</h1>
      <h2>Strona nie znaleziona</h2>
      <p>
        Przepraszamy, strona, której szukasz, nie istnieje lub została
        przeniesiona.
      </p>
      <Link to="/" className={styles.homeLink}>
        Wróć do pulpitu
      </Link>
    </div>
  );
};

export default NotFoundPage;
