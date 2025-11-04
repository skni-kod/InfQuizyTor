package middleware

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("--- AuthRequired Middleware: START ---")

		session := sessions.Default(c)
		userUsosID := session.Get("user_usos_id")

		if userUsosID == nil {
			log.Println("AuthRequired: FAILED. 'user_usos_id' not found in session.")
			log.Println("--- AuthRequired Middleware: END (Aborted) ---")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required. Please log in again."})
			return
		}

		userIDStr, ok := userUsosID.(string)
		if !ok || userIDStr == "" {
			log.Printf("AuthRequired: FAILED. 'user_usos_id' in session is not a valid string: %v", userUsosID)
			log.Println("--- AuthRequired Middleware: END (Aborted) ---")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid session data."})
			return
		}

		log.Printf("AuthRequired: SUCCESS. User ID '%s' found in session.", userIDStr)

		c.Set("user_usos_id", userIDStr)

		log.Println("--- AuthRequired Middleware: END (Continue to next handler) ---")
		c.Next()
	}
}
