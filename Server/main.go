package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"github.com/skni-kod/InfQuizyTor/Server/config"     // Adjust path
	"github.com/skni-kod/InfQuizyTor/Server/db"         // Adjust path
	"github.com/skni-kod/InfQuizyTor/Server/handlers"   // Adjust path
	"github.com/skni-kod/InfQuizyTor/Server/middleware" // Adjust path
	"github.com/skni-kod/InfQuizyTor/Server/services"   // Adjust path
)

func main() {
	// 1. Load Configuration
	cfg, err := config.LoadConfig(".") // Load .env from current directory
	if err != nil {
		log.Fatalf("Could not load config: %v", err)
	}

	// 2. Initialize Database
	db.InitDB(cfg)
	defer db.CloseDB() // Ensure DB pool is closed on exit

	// 3. Initialize USOS Service (OAuth Consumer)
	services.InitUsosService(cfg)

	// 4. Setup Gin Router
	router := gin.Default()

	// 5. Setup CORS (Allow frontend to connect)
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{cfg.FrontendURL}         // Allow your frontend URL
	corsConfig.AllowCredentials = true                          // Important for sessions/cookies
	corsConfig.AddAllowHeaders("Authorization", "Content-Type") // Add headers if needed
	router.Use(cors.New(corsConfig))

	// 6. Setup Sessions
	store := cookie.NewStore([]byte(cfg.SessionSecret))
	router.Use(sessions.Sessions("usos_session", store))

	// 7. Define Routes
	// --- Authentication Routes ---
	authGroup := router.Group("/auth/usos")
	{
		authGroup.GET("/login", handlers.HandleUsosLogin)       // Step 1: Redirect to USOS
		authGroup.GET("/callback", handlers.HandleUsosCallback) // Step 2: Handle callback, get access token
		// authGroup.POST("/logout", handlers.HandleLogout) // Optional logout
	}

	// --- API Proxy Routes ---
	// All routes under /api/* require authentication
	apiGroup := router.Group("/api")
	apiGroup.Use(middleware.AuthRequired()) // Apply auth middleware
	{
		// Catch-all route for proxying
		// Example: GET /api/calendar/user_events -> calls services/calendar/user_events
		apiGroup.GET("/*proxyPath", handlers.HandleApiProxy)
		// Add POST, PUT, DELETE proxy routes if needed, modifying HandleApiProxy accordingly
		// apiGroup.POST("/*proxyPath", handlers.HandleApiProxy)
	}

	// --- Health Check ---
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	// 8. Start Server
	listenAddr := ":8080" // Default port for backend
	log.Printf("Starting server on %s", listenAddr)
	if err := router.Run(listenAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
