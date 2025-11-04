import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import QuizGraph from "../components/Quiz/QuizGraph"; // Import the component
import styles from "./SubjectHubPage.module.scss";
import { Subject } from "../assets/types.tsx"; // Assuming you have Subject type

// Mock subject data (replace with actual data fetching)
const MOCK_SUBJECT_DATA: Subject = {
  id: "s1",
  name: "Analiza Matematyczna",
  icon: () => null,
  color: "",
};

const SubjectHubPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate(); // For the back button in QuizGraph
  const [activeTab, setActiveTab] = useState("path"); // 'path', 'resources', 'contact'

  // Replace with actual data fetching based on subjectId
  const currentSubject = MOCK_SUBJECT_DATA; // Use mock data for now

  const handleBack = () => {
    navigate("/"); // Navigate back to dashboard
  };

  return (
    <>
      {/* No SplineBackground here unless intended */}
      <div className={styles.hubContainer}>
        {/* Header/Title might be handled differently now */}
        {/* <h1>Przedmiot: {currentSubject.name}</h1> */}

        {/* Tabbed interface */}
        <div className={styles.tabs}>
          <button
            className={activeTab === "path" ? styles.tabActive : ""}
            onClick={() => setActiveTab("path")}
          >
            Ścieżka Nauki
          </button>
          <button
            className={activeTab === "resources" ? styles.tabActive : ""}
            onClick={() => setActiveTab("resources")}
          >
            Zasoby
          </button>
          <button
            className={activeTab === "contact" ? styles.tabActive : ""}
            onClick={() => setActiveTab("contact")}
          >
            Kontakt
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* Conditionally render QuizGraph */}
          {activeTab === "path" && (
            <QuizGraph subject={currentSubject} onBack={handleBack} />
          )}
          {activeTab === "resources" && (
            <p>Linki do Teams, Discord, Drive itp.</p>
          )}
          {activeTab === "contact" && (
            <p>Informacje o prowadzących, konsultacje.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SubjectHubPage;
