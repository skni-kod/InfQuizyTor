import { useParams } from "react-router-dom";
import styles from "./SubjectHubPage.module.scss"; // Trzeba utworzyć ten plik

const SubjectHubPage = () => {
  const { subjectId } = useParams();

  return (
    <>
      {/* Tło Spline aktywne tylko w tym widoku [cite: 103] */}

      <div className={styles.hubContainer}>
        <h1>Przedmiot: {subjectId || "Wybierz przedmiot"}</h1>

        {/* Tabbed interface [cite: 104] */}
        <div className={styles.tabs}>
          <button className={styles.tabActive}>Learning Path</button>
          <button>Zasoby</button> {/* [cite: 105] */}
          <button>Kontakt</button> {/* [cite: 105] */}
        </div>

        <div className={styles.tabContent}>
          {/* ... Treść zakładki ... */}
          <p>Zawartość ścieżki nauki dla {subjectId}</p>
        </div>
      </div>
    </>
  );
};

export default SubjectHubPage;
