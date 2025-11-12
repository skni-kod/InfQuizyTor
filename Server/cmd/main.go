package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/handlers"   // Zakładam, że tu są Twoje handlery
	"github.com/skni-kod/InfQuizyTor/Server/middleware" // Zakładam, że tu jest middleware
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Nie można załadować konfiguracji: %v", err)
	}

	db.InitDB(cfg)
	defer db.CloseDB()

	services.InitUsosService(cfg) // Ważne, aby zainicjować serwis

	router := gin.Default()

	router.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// --- CORS ---
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL} // np. "http://localhost:5173"
	corsConfig.AllowCredentials = true
	corsConfig.AddAllowHeaders("Authorization", "Content-Type")
	router.Use(cors.New(corsConfig))

	// --- Sesje ---
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// --- Trasy Autoryzacji (Publiczne) ---
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		// Użyj POST dla wylogowania, aby być RESTful
		authGroup.POST("/logout", handlers.HandleLogout)
	}

	// --- Trasy API (Chronione) ---
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired()) // Zabezpiecz wszystkie trasy /api
	{
		// --- POCZĄTEK POPRAWKI ---

		// 1. DEDYKOWANA TRASA DLA /api/users/me
		// Ta trasa MUSI być zdefiniowana PRZED ogólnym proxy.
		// Używa handlera, który czyta z BAZY DANYCH (ten, który Ci wysłałem).
		apiGroup.GET("/users/me", handlers.HandleGetUserMe)

		// 2. OGÓLNE PROXY DLA WSZYSTKICH INNYCH RZECZY Z USOS
		// Zwróć uwagę na ścieżkę: "/services/*proxyPath"
		// Przechwyci ona /api/services/tt/user, /api/services/grades/latest itp.
		// ALE NIE PRZECHWYCI /api/users/me
		apiGroup.GET("/services/*proxyPath", handlers.HandleApiProxy)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	listenAddr := ":8080"
	log.Printf("Serwer nasłuchuje na %s", listenAddr)
	if err := router.Run(listenAddr); err != nil {
		log.Fatalf("Nie udało się uruchomić serwera: %v", err)
	}
}
