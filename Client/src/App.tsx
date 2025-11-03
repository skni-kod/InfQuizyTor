import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SubjectHubPage from "./pages/SubjectHubPage";
import NotFoundPage from "./pages/NotFoundPage";
import QuizPage from "./pages/QuizPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import { useAppContext } from "./contexts/AppContext";
import { UsosUserInfo } from "./assets/types.tsx"; // Upewnij się, że ścieżka do typów jest poprawna

function App() {
  const { setUser, setAuthLoading } = useAppContext();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // --- POCZĄTEK POPRAWKI ---
        const response = await fetch(
          "/api/services/users/user?fields=id|first_name|last_name|email",
          {
            credentials: "include", // *** TO JEST KLUCZOWA ZMIANA ***
            headers: {
              Accept: "application/json",
            },
          }
        );
        // --- KONIEC POPRAWKI ---

        if (response.ok) {
          const userData: UsosUserInfo = await response.json();
          setUser(userData);
        } else {
          // Jeśli odpowiedź NIE JEST ok (np. 401 Unauthorized), ustaw użytkownika na null
          setUser(null);
          // Logowanie błędu, jeśli nie udało się zalogować, jest normalne
          console.log(
            `Status autoryzacji: ${response.status}. Użytkownik niezalogowany.`
          );
        }
      } catch (error) {
        // Ten błąd (Unexpected token '<') wystąpi, jeśli 'response.ok' jest false,
        // a my spróbujemy parsować HTML jako JSON *przed* sprawdzeniem statusu.
        // Ale teraz kod najpierw sprawdza 'response.ok'.
        console.error("Błąd podczas sprawdzania statusu autoryzacji:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, [setUser, setAuthLoading]); // Zależności są poprawne

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
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
