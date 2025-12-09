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

	// Inicjalizacja serwisów
	services.InitUsosService(cfg)
	services.InitGeminiService(cfg)

	// Wstrzyknięcie serwisów do handlerów
	usosService := services.NewUsosAPIService(cfg.UsosConsumerKey, cfg.UsosConsumerSecret)
	subjectHandler := handlers.NewSubjectHandler(usosService) // Używamy NewSubjectHandler z nowym UsosAPIService

	router := gin.Default()
	router.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Konfiguracja CORS i Sesji (bez zmian)
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL}
	corsConfig.AllowCredentials = true
	corsConfig.AddAllowHeaders("Authorization", "Content-Type")
	router.Use(cors.New(corsConfig))

	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// Auth (bez zmian)
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)
		authGroup.GET("/callback", handlers.HandleUsosCallback)
		authGroup.POST("/logout", handlers.HandleLogout)
	}

	// API Protected
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired())
	{
		apiGroup.GET("/users/me", handlers.HandleGetUserMe)

		// --- DASHBOARD ENDPOINTS (bez zmian) ---
		apiGroup.GET("/dashboard/upcoming", handlers.HandleGetUpcomingEvents)
		apiGroup.GET("/dashboard/progress", handlers.HandleGetDashboardProgress)
		apiGroup.GET("/dashboard/leaderboard", handlers.HandleGetDashboardLeaderboard)
		apiGroup.GET("/dashboard/achievements", handlers.HandleGetDashboardAchievements)

		// Subjects & Topics
		apiGroup.GET("/subjects", handlers.HandleGetSubjects)
		apiGroup.POST("/subjects/sync", handlers.HandleSyncSubjects)
		apiGroup.GET("/subjects/:usos_id/topics", handlers.HandleGetTopicsByUsosID)
		apiGroup.POST("/topics", handlers.HandleCreateTopic)
		apiGroup.GET("/subjects/:usos_id/graph", handlers.HandleGetCourseGraph)

		// ➡️ POPRAWKA: Rejestracja nowego handlera Gin dla szczegółów jednostki kursu
		// Endpoint oczekiwany przez frontend: /api/subjects/unit-details?course_unit_id=...
		apiGroup.GET("/subjects/unit-details", subjectHandler.HandleGetCourseUnitDetails)

		// Usunięto: http.HandleFunc("/subjects/", handlers.SubjectRouter)

		// Content Generation (bez zmian)
		apiGroup.POST("/topics/upload", handlers.HandleContentUpload)
		apiGroup.POST("/flashcards/manual", handlers.HandleManualFlashcard)
		apiGroup.GET("/topics/:id/content", handlers.HandleGetTopicContent)

		apiGroup.GET("/calendar/all-events", handlers.HandleGetAllCalendarEvents)
		apiGroup.GET("/calendar/usos-groups", handlers.HandleGetUserUsosGroups)
		apiGroup.POST("/calendar/layers", handlers.HandleCreateCalendarLayer)

		// Groups (bez zmian)
		apiGroup.GET("/groups/all", handlers.HandleGetAllUserGroups)

		// Admin (bez zmian)
		adminGroup := apiGroup.Group("/admin")
		adminGroup.Use(middleware.AdminRequired())
		{
			adminGroup.GET("/pending-flashcards", handlers.HandleGetPendingFlashcards)
			adminGroup.POST("/approve-flashcard/:id", handlers.HandleApproveFlashcard)
			adminGroup.POST("/reject-flashcard/:id", handlers.HandleRejectFlashcard)
		}

		// Proxy Fallback (bez zmian)
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
