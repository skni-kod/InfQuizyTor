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
	"github.com/skni-kod/InfQuizyTor/Server/handlers"
	"github.com/skni-kod/InfQuizyTor/Server/middleware"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Nie można załadować konfiguracji: %v", err)
	}

	db.InitDB(cfg)
	defer db.CloseDB()

	services.InitUsosService(cfg)

	router := gin.Default()

	// Ustawienie zaufanych proxy (dla ostrzeżenia GIN)
	router.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL}
	corsConfig.AllowCredentials = true
	corsConfig.AddAllowHeaders("Authorization", "Content-Type")
	router.Use(cors.New(corsConfig))

	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// Trasy Autoryzacji
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		// Użyj POST dla wylogowania i chroń middlewarem
		authGroup.POST("/logout", middleware.AuthRequired(), handlers.HandleLogout)
	}

	// Trasy API
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired()) // Zabezpiecz wszystkie trasy /api
	{
		// POPRAWKA: Dedykowana trasa dla /api/users/me
		// Musi być *przed* catch-all /*proxyPath
		apiGroup.GET("/users/me", handlers.HandleGetUserMe) // Użyj nowego dedykowanego handlera

		// Trasa proxy dla reszty
		apiGroup.GET("/*proxyPath", handlers.HandleApiProxy)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	listenAddr := ":8080" // Domyślny port backendu
	log.Printf("Serwer nasłuchuje na %s", listenAddr)
	if err := router.Run(listenAddr); err != nil {
		log.Fatalf("Nie udało się uruchomić serwera: %v", err)
	}
}
