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

	// Inicjalizujemy oba serwisy
	services.InitUsosService(cfg)
	services.InitGeminiService(cfg)

	router := gin.Default()
	router.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Cors i Sesje
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL}
	corsConfig.AllowCredentials = true
	corsConfig.AddAllowHeaders("Authorization", "Content-Type")
	router.Use(cors.New(corsConfig))
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// Trasy Publiczne (Logowanie/Wylogowanie)
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		authGroup.POST("/logout", handlers.HandleLogout)
	}

	// Trasy Chronione (dla wszystkich zalogowanych)
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired())
	{
		// USOS Proxy (oryginalne)
		apiGroup.GET("/users/me", handlers.HandleGetUserMe)
		apiGroup.GET("/services/*proxyPath", handlers.HandleApiProxy)

		// --- NOWE TRASY APLIKACJI ---

		// Trasy dla Przedmiotów i Tematów
		apiGroup.GET("/subjects", handlers.HandleGetSubjects) // Synchronizuje i pobiera przedmioty
		apiGroup.GET("/subjects/:id/topics", handlers.HandleGetTopics)
		apiGroup.POST("/topics", handlers.HandleCreateTopic) // Tworzenie nowego tematu

		// Trasy dla Generowania Treści (AI i Ręczne)
		apiGroup.POST("/topics/upload", handlers.HandleContentUpload)       // Przez AI (pliki)
		apiGroup.POST("/flashcards/manual", handlers.HandleManualFlashcard) // Ręczne fiszki

		// Trasy do Pobierania Treści (dla studentów)
		apiGroup.GET("/topics/:id/content", handlers.HandleGetTopicContent) // Dla modala

		// Trasy dla Admina (Moderacja)
		adminGroup := apiGroup.Group("/admin")
		adminGroup.Use(middleware.AdminRequired()) // Dodatkowe zabezpieczenie rolą "admin"
		{
			adminGroup.GET("/pending-flashcards", handlers.HandleGetPendingFlashcards)
			adminGroup.POST("/approve-flashcard/:id", handlers.HandleApproveFlashcard)
			adminGroup.POST("/reject-flashcard/:id", handlers.HandleRejectFlashcard)
			// TODO: Dodać trasy do moderacji quizów (np. /pending-quiz-questions)
		}
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
