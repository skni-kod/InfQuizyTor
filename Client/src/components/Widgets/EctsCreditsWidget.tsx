import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import Card from "../Common/Card";
import styles from "./EctsCreditsWidget.module.scss";

const EctsCreditsWidget: React.FC = () => {
  const apiPath = "services/credits/used_sum";

  // Wywołujemy hook bez 'fields', aby dostać łączną sumę
  // Oczekujemy odpowiedzi typu 'number'
  const { data, loading, error } = useUsosApi<number>(apiPath);

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie sumy ECTS...</p>;
  } else if (error) {
    content = <p className={styles.error}>Błąd ładowania ECTS: {error}</p>;
  } else if (data !== null && data !== undefined) {
    // Formatujemy liczbę do jednego miejsca po przecinku
    const ectsValue = Number(data).toFixed(1);

    content = (
      <div className={styles.creditsWidget}>
        <div className={styles.creditsValue}>{ectsValue}</div>
        <div className={styles.creditsLabel}>Łączna suma punktów ECTS</div>
      </div>
    );
  } else {
    content = <p>Nie można było pobrać sumy ECTS.</p>;
  }

  return <Card title="Wykorzystane ECTS">{content}</Card>;
};

export default EctsCreditsWidget;
