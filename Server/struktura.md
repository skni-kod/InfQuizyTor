# Struktura

backend/
├── cmd/ # Główny plik startowy aplikacji
│ └── main.go # Punkt wejścia
├── internal/ # Kod wewnętrzny, logika biznesowa, nie publiczne API
│ ├── api/ # Kontrolery HTTP (obsługa żądań/odpowiedzi)
│ │ ├── handler/ # Funkcje obsługi (np. GetUser, CreateQuiz)
│ │ └── router.go # Definicje ścieżek (korzystając z Gorilla Mux)
│ ├── core/ # Serwisy i logika biznesowa (np. logika grywalizacji)
│ │ ├── service/ # Implementacja logiki (np. UserService, QuizService)
│ │ └── model/ # Struktury danych (encji), np. User, Course, Quiz
│ ├── data/ # Repozytoria (interakcja z bazą danych)
│ │ └── repository/ # Implementacja operacji CRUD (np. UserRepository)
│ └── middleware/ # Funkcje pośredniczące (np. Auth, CORS, Logger)
├── pkg/ # Kod publicznie używany, np. klienci API (USOS API Client)
│ └── usos/ # Klient do komunikacji z USOS API
├── migrations/ # Skrypty migracji bazy danych (np. za pomocą `goose` lub `migrate`)
├── .env # Zmienne środowiskowe (połączenie z DB, klucze API)
└── go.mod # Definicja modułu Go
