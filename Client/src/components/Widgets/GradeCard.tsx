// Plik: src/components/Cards/GradesCard.tsx
import React from "react";
import { useUsosApi } from "../../hooks/useUsosApi";
import type { UsosGrade } from "../../assets/types";
// Import uniwersalnego komponentu Card
import Card from "../../components/Common/Card";

const GradesCard: React.FC = () => {
  const endpoint = "services/grades/user";
  const fields = "course_id|course_name|term_id|value_symbol|value_description";

  const { data, loading, error } = useUsosApi<UsosGrade[]>(endpoint, fields);

  // Funkcja, którą można wywołać po kliknięciu
  const handleCardClick = () => {
    console.log("Kliknięto kartę ocen!");
  };

  return (
    // Użyj komponentu Card zamiast <div>
    <Card title="Ostatnie Oceny" onClick={handleCardClick}>
      {loading && <p>Ładowanie ocen...</p>}

      {/* Użyj klasy błędu z uniwersalnego komponentu, jeśli chcesz */}
      {error && <p style={{ color: "#d9534f" }}>{error}</p>}

      {data && data.length > 0 ? (
        <ul>
          {data.slice(0, 5).map((grade) => (
            <li key={`${grade.course_id}-${grade.term_id}`}>
              <strong>{grade.value_symbol}</strong> - {grade.course_name.pl}
            </li>
          ))}
        </ul>
      ) : (
        !loading && !error && <p>Brak ocen do wyświetlenia.</p>
      )}
    </Card>
  );
};
export default GradesCard;
