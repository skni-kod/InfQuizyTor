package main

import (
	"log"
	"net/http"

	// Zewnętrzne zależności (pobrane przez 'go mod tidy')
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	// Pakiety z Twojego projektu (użyj poprawnej ścieżki modułu)
	"github.com/skni-kod/InfQuizyTor/Server/config"     // Zmieniona ścieżka
	"github.com/skni-kod/InfQuizyTor/Server/db"         // Zmieniona ścieżka
	"github.com/skni-kod/InfQuizyTor/Server/handlers"   // Zmieniona ścieżka
	"github.com/skni-kod/InfQuizyTor/Server/middleware" // Zmieniona ścieżka
	"github.com/skni-kod/InfQuizyTor/Server/services"   // Zmieniona ścieżka
)

func main() {
	// 1. Załaduj Konfigurację z pliku .env
	cfg, err := config.LoadConfig(".") // Szukaj .env w bieżącym katalogu
	if err != nil {
		log.Fatalf("Nie można załadować konfiguracji: %v", err)
	}

	// 2. Zainicjuj Połączenie z Bazą Danych (PostgreSQL)
	db.InitDB(cfg)
	// Odłóż zamknięcie puli połączeń do końca działania programu
	defer db.CloseDB()

	// 3. Zainicjuj Serwis USOS (Konfiguracja Konsumenta OAuth 1.0a)
	services.InitUsosService(cfg)

	// 4. Skonfiguruj Router Gin
	router := gin.Default()

	// 5. Skonfiguruj CORS (Cross-Origin Resource Sharing)
	// Pozwala frontendowi (np. z localhost:5173) komunikować się z backendem (localhost:8080)
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL}         // Użyj adresu URL frontendu z konfiguracji
	corsConfig.AllowCredentials = true                          // Niezbędne do obsługi sesji/ciasteczek
	corsConfig.AddAllowHeaders("Authorization", "Content-Type") // Dodaj nagłówki, jeśli frontend ich używa
	router.Use(cors.New(corsConfig))

	// 6. Skonfiguruj Sesje (używając ciasteczek)
	// Użyj sekretu sesji z konfiguracji do podpisania ciasteczek
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	// Nazwa ciasteczka sesji: "usos_session"
	router.Use(sessions.Sessions("usos_session", store))

	// 7. Zdefiniuj Trasy (Endpoints)
	// --- Trasy Autoryzacji OAuth ---
	authGroup := router.Group("/auth/usos")
	{
		// Rozpoczęcie procesu logowania -> przekierowanie do USOS
		authGroup.GET("/login", handlers.HandleUsosLogin)
		// Obsługa powrotu z USOS po autoryzacji -> wymiana tokenów, stworzenie sesji
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		// Opcjonalna trasa do wylogowania
		// authGroup.POST("/logout", handlers.HandleLogout)
	}

	// --- Trasy Proxy do API USOS ---
	// Wszystkie trasy pod /api/* będą wymagały aktywnej sesji użytkownika
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired()) // Zastosuj middleware sprawdzający sesję
	{
		// Trasa typu "catch-all" do przekazywania żądań GET do USOS API
		// Przykład: żądanie GET na /api/services/calendar/user_events
		// zostanie przekazane do USOS API jako /services/calendar/user_events
		// po podpisaniu żądania tokenem zalogowanego użytkownika.
		// "*proxyPath" przechwytuje całą ścieżkę po /api/
		apiGroup.GET("/*proxyPath", handlers.HandleApiProxy)

		// TODO: Dodaj obsługę innych metod HTTP (POST, PUT, DELETE) jeśli potrzebujesz
		// np. modyfikując HandleApiProxy lub tworząc osobne handlery.
		// apiGroup.POST("/*proxyPath", handlers.HandleApiProxy)
	}

	// --- Trasa Sprawdzająca Stan Serwera ---
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	// 8. Uruchom Serwer HTTP
	listenAddr := ":8080" // Port, na którym nasłuchuje backend
	log.Printf("Serwer nasłuchuje na %s", listenAddr)
	// Uruchom serwer Gin i obsłuż ewentualny błąd przy starcie
	if err := router.Run(listenAddr); err != nil {
		log.Fatalf("Nie udało się uruchomić serwera: %v", err)
	}
}
