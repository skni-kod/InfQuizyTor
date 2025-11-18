import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SubjectHubPage from "./pages/SubjectHubPage";
import NotFoundPage from "./pages/NotFoundPage";
import QuizPage from "./pages/QuizPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import { useAppContext } from "./contexts/AppContext";
import { UsosUserInfo } from "./assets/types.tsx";
import ApiPage from "./pages/ApiPage.tsx";
import TestsPage from "./pages/Tests.tsx";
import AdminPage from "./pages/AdminPage.tsx";

function App() {
  const { authState, setLoggedInUser, setUser, setAuthLoading } =
    useAppContext();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // --- POPRAWKA ---
        // Odpytujemy dedykowany endpoint /api/users/me z backendu Go
        const response = await fetch("/api/users/me", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });
        // --- KONIEC POPRAWKI ---

        if (response.ok) {
          const userData: UsosUserInfo = await response.json();
          setLoggedInUser(userData);
        } else {
          setUser(null);
          setAuthLoading(false);
          console.log(
            `Status autoryzacji: ${response.status}. Użytkownik niezalogowany.`
          );
        }
      } catch (error) {
        // Błąd ECONNREFUSED pojawi się tutaj
        console.error("Błąd podczas sprawdzania statusu autoryzacji:", error);
        setUser(null);
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, [setLoggedInUser, setUser, setAuthLoading]);

  // Nie renderuj niczego, dopóki sprawdzanie sesji się nie zakończy
  if (authState.authLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Ładowanie sesji...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tests/api" element={<ApiPage />} />
        <Route path="tests" element={<TestsPage />} />
        <Route path="admin" element={<AdminPage />} />

        <Route path="przedmioty" element={<SubjectHubPage />} />
        <Route path="przedmioty/:subjectId" element={<SubjectHubPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/quiz/:subjectId/:quizId" element={<QuizPage />} />
    </Routes>
  );
}

export default App;
