import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SubjectHubPage from "./pages/SubjectHubPage";
import NotFoundPage from "./pages/NotFoundPage";
import QuizPage from "./pages/QuizPage"; // <-- Import the new page

function App() {
  return (
    <Routes>
      {/* Routes within the main layout (with Header) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="przedmioty" element={<SubjectHubPage />} />
        <Route path="przedmioty/:subjectId" element={<SubjectHubPage />} />
        <Route path="community" element={<div>Community Page</div>} />
        <Route path="profil" element={<div>Profile Page</div>} />
      </Route>

      {/* Route for the Quiz view - RENDERED OUTSIDE MainLayout */}
      <Route
        path="/quiz/:subjectId/:quizId"
        element={<QuizPage />} // <-- Use the actual component
      />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
