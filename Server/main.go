package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	// Użyj poprawnej ścieżki modułu z go.mod
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/handlers"
	"github.com/skni-kod/InfQuizyTor/Server/middleware"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func main() {
	// 1. Załaduj Konfigurację
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Nie można załadować konfiguracji: %v", err)
	}

	// 2. Zainicjuj Bazę Danych
	db.InitDB(cfg)
	defer db.CloseDB()

	// 3. Zainicjuj Serwis USOS (OAuth)
	services.InitUsosService(cfg)

	// 4. Skonfiguruj Router Gin
	router := gin.Default()

	// 5. Skonfiguruj CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL} // Pozwól na żądania z frontendu
	corsConfig.AllowCredentials = true                  // Niezbędne do sesji
	corsConfig.AddAllowHeaders("Authorization", "Content-Type")
	router.Use(cors.New(corsConfig))

	// 6. Skonfiguruj Sesje
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// 7. Zdefiniuj Trasy
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		// authGroup.POST("/logout", handlers.HandleLogout)
	}

	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired()) // Zabezpiecz wszystkie trasy API
	{
		// Przechwytuje np. /api/services/calendar/user_events
		apiGroup.GET("/*proxyPath", handlers.HandleApiProxy)
		// TODO: Dodaj obsługę POST/PUT/DELETE jeśli potrzebne
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	// 8. Uruchom Serwer (na porcie 8080)
	listenAddr := ":8080" // POPRAWKA: Użyj standardowego portu 8080
	log.Printf("Serwer nasłuchuje na %s", listenAddr)
	if err := router.Run(listenAddr); err != nil {
		log.Fatalf("Nie udało się uruchomić serwera: %v", err)
	}
}
