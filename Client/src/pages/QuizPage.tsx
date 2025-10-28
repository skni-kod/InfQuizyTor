import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "./QuizPage.module.scss"; // Import styles

const QuizPage = () => {
  // Get parameters from the URL (defined in App.tsx route)
  const { subjectId, quizId } = useParams();
  const navigate = useNavigate(); // Hook to navigate back

  // Function to handle going back to the dashboard or subject hub
  const handleGoBack = () => {
    // Navigate back to the main dashboard for simplicity,
    // or you could navigate back to the specific subject hub: navigate(`/przedmioty/${subjectId}`);
    navigate("/");
  };

  return (
    <div className={styles.quizContainer}>
      <button onClick={handleGoBack} className={styles.backButton}>
        ← Wróć do pulpitu
      </button>

      <h1>Quiz Interface 📝</h1>
      <p>
        Tutaj będzie interfejs quizu dla przedmiotu:{" "}
        <strong>{subjectId}</strong>
      </p>
      <p>
        Quiz ID: <strong>{quizId}</strong>
      </p>

      {/* Placeholder for actual quiz content */}
      <div className={styles.quizContent}>
        <p>(Pytania i odpowiedzi pojawią się tutaj...)</p>
      </div>
    </div>
  );
};

export default QuizPage;
