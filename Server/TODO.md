# Todo

Synchronizacja przedmiotów z USOS.

Zarządzanie treścią (Tematy).

Generowanie AI (Gemini) z obrazów i tekstu.

Panel moderacji dla Admina.

Uniwersalny kalendarz z warstwami (USOS, prywatne, grupowe).

## 🚀 Faza 0: Fundamenty i Naprawa Błędów

Zanim zaczniemy cokolwiek nowego, musimy sprawić, by projekt w ogóle działał.

[ ] Napraw zależności Go:

[ ] Upewnij się, że masz tylko jedną bibliotekę oauth1. Zaloguj się do Server/ i uruchom:

Bash

go get github.com/gomodule/oauth1@latest
go mod tidy
[ ] Napraw błędy kompilacji Go:

[ ] Server/services/usos_service.go: Zastąp całą zawartość pliku tym kodem, który jest poprawnie napisany dla gomodule/oauth1 i naprawia błąd url must not contain a query string.

[ ] Server/handlers/auth_handlers.go: Zastąp całą zawartość pliku tym kodem, aby poprawnie obsługiwał przekierowania błędów na adres frontendu.

[ ] Napraw błędy routingu Go:

[ ] Server/main.go: Zastąp całą zawartość pliku tym kodem, który poprawnie rozdziela trasy /api/users/me (do bazy) i /api/services/\*proxyPath (do USOS).

[ ] Napraw logowanie na frontendzie:

[x] Client/src/layouts/Header.tsx: Zastąp całą zawartość pliku tym kodem, który implementuje handleLogin (pobiera JSON i przekierowuje) zamiast zwykłego linku .

[ ] Wyczyść dane:

[ ] Uruchom serwer Go.

Usuń ręcznie wszystkich użytkowników i tokeny ze swojej bazy danych (aby wymusić czyste logowanie).

Wyczyść ciasteczka w przeglądarce.

[ ] Testuj:

[ ] Zaloguj się. Musisz teraz zobaczyć pełną listę uprawnień (Oceny, Plan zajęć, Mail) na stronie USOS.

[ ] Po zalogowaniu, błędy 401 i 404 na pulpicie powinny zniknąć (z wyjątkiem tych od fields z nawiasami).

## 📦 Faza 1: Backend (Go) - Implementacja Logiki Biznesowej

Teraz, gdy logowanie działa, implementujemy resztę.

[ ] Konfiguracja (config.go i .env):

[ ] Dodaj GEMINI_API_KEY do pliku .env.

[x] Dodaj pole GeminiAPIKey string do struktury Config w config/config.go.

[ ] Modele (models/models.go):

[ ] Zastąp całą zawartość pliku models.go tym kodem, który zawiera Role w User oraz wszystkie nowe tabele (Subject, Topic, Flashcard, QuizQuestion, UserGroupRole, CalendarLayer, CalendarEvent) i typy USOS.

[ ] Baza Danych (db/db.go):

[ ] Zastąp całą zawartość db.go tym kodem, który dodaje nowe modele do AutoMigrate i zawiera wszystkie nowe metody CRUD (np. FindOrCreateSubjectByUsosID, GetPendingFlashcards, SetFlashcardStatus itd.).

[ ] Serwisy:

[ ] services/usos_service.go: Dodaj nowe funkcje GetCourses i GetUserGroups (są w tym kodzie).

[ ] services/gemini_service.go: Stwórz nowy plik z tym kodem do obsługi Gemini 1.5 Pro.

[ ] Middleware:

[ ] middleware/admin_middleware.go: Stwórz nowy plik z tym kodem do sprawdzania roli admina.

[ ] Handlery (Tutaj dzieje się magia):

[ ] handlers/subject_handlers.go: Stwórz nowy plik z tym kodem (obsługuje GET /api/subjects i GET /api/subjects/:id/topics).

[ ] handlers/topic_handlers.go: Stwórz nowy plik z tym kodem (obsługuje POST /api/topics do tworzenia tematów).

[ ] handlers/generation_handler.go: Stwórz nowy plik z tym kodem (obsługuje POST /api/topics/upload i POST /api/flashcards/manual).

[ ] handlers/admin_handlers.go: Stwórz nowy plik z tym kodem (obsługuje GET /pending..., POST /approve..., POST /reject...).

[ ] handlers/content_handlers.go: Stwórz nowy plik z tym kodem (obsługuje GET /api/topics/:id/content dla modala).

[ ] handlers/calendar_handlers.go: Stwórz nowy plik z tym kodem (obsługuje GET /calendar/all-events, GET /calendar/usos-groups, POST /calendar/layers).

[ ] Routing (main.go):

[ ] Zastąp całą zawartość main.go tym kodem, który poprawnie inicjuje oba serwisy i łączy wszystkie nowe trasy (w tym grupy /api i /admin).

## ⚛️ Faza 2: Frontend (React) - Budowa Interfejsu

Teraz, gdy backend jest gotowy, budujemy UI, aby z niego korzystał.

[ ] Konfiguracja Globalna:

[ ] src/assets/types.tsx: Zastąp całą zawartość pliku tym kodem. Zawiera on teraz Role w UsosUserInfo oraz wszystkie nowe typy (Subject, Topic, Flashcard, QuizQuestion, AppCalendarEvent).

[ ] src/App.tsx: Dodaj trasy dla SubjectHubPage (/subjects/:subjectId) i AdminPage (/admin).

[ ] Pulpit (Dashboard):

[ ] src/pages/ApiPage.tsx: Usuń stare, niedziałające widgety (GradesCard, TestsCard).

[ ] src/components/Widgets/UserCoursesWidget.tsx: Napraw błąd fields, zmieniając go na const fields = "terms|course_editions";.

[ ] src/components/Widgets/BuildingIndexWidget.tsx: Napraw błąd fields, zmieniając go na const fields = "id|name|postal_address|location|photo_urls";.

[ ] src/components/Widgets/CustomGroupsWidget.tsx: Napraw błąd fields, zmieniając go na const fields = "id|name";.

[ ] Kalendarz V2: Zastąp UsosCalendar nowym CalendarContainer.

[ ] Strona Przedmiotu (Subject Hub):

[ ] src/pages/SubjectHubPage.tsx: Zastąp całą zawartość tym kodem (wersja z zakładkami, modalami i obsługą kliknięć).

[ ] src/components/Quiz/QuizGraph.tsx: Zastąp całą zawartość tym kodem (wersja, która przyjmuje onBack i onNodeClick).

[ ] src/components/Quiz/mock-graph-data.ts: Stwórz ten plik (kod jest w tym pliku).

[ ] Studio Treści (Content Studio):

[ ] Stwórz folder src/components/Studio/.

[ ] ResourceStudio.tsx: Stwórz plik z tym kodem.

[ ] AiContentGenerator.tsx: Stwórz plik z tym kodem.

[ ] ManualFlashcardForm.tsx: Stwórz plik z tym kodem.

[ ] TopicViewerModal.tsx: Stwórz plik z tym kodem (wersja, która pobiera dane z GET /api/topics/:id/content).

[ ] Pliki .scss: Stwórz wszystkie 4 pasujące pliki .scss dla komponentów Studio (kody są w moich poprzednich odpowiedziach).

[ ] Panel Admina:

[ ] src/pages/AdminPage.tsx: Stwórz nowy plik z tym kodem (chroniony logiką user.role).

[ ] src/components/Admin/ModerationQueue.tsx: Stwórz nowy plik z tym kodem (logika pobierania i akceptowania/odrzucania).

[ ] Pliki .scss: Stwórz pasujące pliki .scss dla komponentów Admina.

## 🚀 Faza 3: Wdrożenie (Status Builda)

Gdy wszystko działa lokalnie, czas na wdrożenie.

[ ] Przygotowanie Backendu (Go):

[ ] Przejdź do trybu "release": GIN_MODE=release.

[ ] Zbuduj statyczną binarkę: CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

[ ] Stwórz Dockerfile dla Go, który kopiuje plik main i plik .env.

[ ] Przygotowanie Frontendu (React):

[ ] Zbuduj statyczne pliki: cd Client && pnpm build. Wynik znajdzie się w Client/dist.

[ ] Konfiguracja Serwera (Nginx/Caddy):

[ ] Skonfiguruj serwer (np. Nginx) jako odwrotne proxy.

[ ] Reguła 1: Wszystkie żądania location /api/ oraz location /auth/ muszą być przekierowane do Twojego backendu Go (np. proxy_pass <http://localhost:8080>;).

[ ] Reguła 2: Wszystkie inne żądania (location /) muszą serwować pliki statyczne z Client/dist.

[ ] Reguła 3 (Kluczowa dla React Router): Żądania do nieistniejących plików (np. /subjects/123) muszą być przechwycone i muszą zwrócić index.html (użyj try_files $uri /index.html;).

[ ] Baza Danych:

[ ] Stwórz produkcyjną bazę danych PostgreSQL (np. na Supabase, Railway lub DigitalOcean).

[ ] Zmienne Środowiskowe (Produkcja):

[ ] Ustaw wszystkie zmienne z pliku .env na serwerze produkcyjnym.

[ ] WAŻNE: Upewnij się, że APP_BASE_URL (dla Go) i USOS_CALLBACK_URL wskazują na Twój publiczny adres URL (np. <https://infquizytor.pl>), a nie localhost:8080.

[ ] Zmień FRONTEND_URL na swój publiczny adres (np. <https://infquizytor.pl>), aby CORS działał poprawnie.
