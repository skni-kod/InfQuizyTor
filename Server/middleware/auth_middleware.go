package middleware

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// AuthRequired checks if a user is logged in (based on session)
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userUsosID := session.Get("user_usos_id")

		if userUsosID == nil {
			// User not logged in, return Unauthorized or redirect to login
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}

		// Store user ID in context for downstream handlers
		c.Set("user_usos_id", userUsosID)
		c.Next() // Proceed to the next handler
	}
}
