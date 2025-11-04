import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import { UsosTest } from "../../assets/types"; // Upewnij się, że ten typ istnieje
import Card from "../Common/Card"; // Import uniwersalnej karty

const TestsCard: React.FC = () => {
  // UWAGA: Endpoint i pola są PRZYKŁADOWE!
  // Musisz sprawdzić w dokumentacji API USOS, czy 'services/crstests/user_tests' jest poprawny
  const endpoint = "services/crstests/user_tests";
  const fields = "course_id|course_name|name|start_time|end_time|result|url";

  const { data, loading, error } = useUsosApi<UsosTest[]>(endpoint, fields);

  let content: React.ReactNode;

  if (loading) {
    content = <p>Ładowanie sprawdzianów...</p>;
  } else if (error) {
    content = <p style={{ color: "#d9534f" }}>{error}</p>;
  } else if (data && data.length > 0) {
    content = (
      <ul>
        {data.slice(0, 5).map(
          (
            test,
            index // Pokaż tylko 5
          ) => (
            <li key={test.url || index}>
              <strong>{test.name}</strong> ({test.course_name.pl})
              <br />
              <small>{new Date(test.start_time).toLocaleString("pl-PL")}</small>
            </li>
          )
        )}
      </ul>
    );
  } else {
    content = <p>Brak nadchodzących sprawdzianów.</p>;
  }

  return <Card title="Sprawdziany i Zaliczenia">{content}</Card>;
};

// Ta linia jest kluczowa, aby plik stał się modułem!
export default TestsCard;
