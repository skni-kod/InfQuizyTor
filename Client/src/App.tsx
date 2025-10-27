// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { Dashboard } from "./components/Dashboard/Dashboard";
// W przyszłości możesz tu dodać inne widoki
// import { LoginPage } from './components/Login/LoginPage';
// import { ProfilePage } from './components/Profile/ProfilePage';

export const App = () => {
  return (
    <Routes>
      {/* Główna i jedyna strona to nasz Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Przykładowe przyszłe ścieżki */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
      {/* <Route path="/profile/:userId" element={<ProfilePage />} /> */}

      {/* Ścieżka "catch-all" dla 404 */}
      {/* <Route path="*" element={<div>404 - Not Found</div>} /> */}
    </Routes>
  );
};
