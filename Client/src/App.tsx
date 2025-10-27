import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Pulpit } from "./pages/Pulpit"; // To będzie nasza główna strona

// Usuwamy SubjectGraphPage, ponieważ jest teraz częścią Pulpitu

const CommunityPage = () => <div>Społeczność (w budowie)</div>;
const ProfilePage = () => <div>Profil (w budowie)</div>;

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Pulpit jest teraz jedyną główną stroną */}
        <Route index element={<Pulpit />} />

        {/* Ta ścieżka już nie jest potrzebna, graf jest na Pulpicie */}
        {/* <Route path="przedmioty" element={<SubjectGraphPage />} /> */}

        <Route path="spolecznosc" element={<CommunityPage />} />
        <Route path="profil" element={<ProfilePage />} />

        <Route path="*" element={<div>404 - Nie znaleziono strony</div>} />
      </Route>
    </Routes>
  );
};
