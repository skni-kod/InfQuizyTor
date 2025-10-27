import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout"; // Poprawiona ścieżka
import DashboardPage from "./pages/DashboardPage";
import SubjectHubPage from "./pages/SubjectHubPage";
//import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="przedmioty" element={<SubjectHubPage />} />
        <Route path="przedmioty/:subjectId" element={<SubjectHubPage />} />
        <Route path="community" element={<div>Community Page</div>} />
        <Route path="profil" element={<div>Profile Page</div>} />
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
