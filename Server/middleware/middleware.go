package middleware

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Println("--- AdminRequired Middleware: START ---")
		// Pobieramy ID z sesji (ustawione przez AuthRequired)
		userUsosIDValue, _ := c.Get("user_usos_id")
		userUsosID := userUsosIDValue.(string)

		user, err := db.UserRepository.GetUserByUsosID(userUsosID)
		if err != nil {
			utils.SendError(c, http.StatusUnauthorized, "Nie znaleziono użytkownika")
			return
		}

		if user.Role != "admin" {
			log.Printf("AdminRequired: FAILED. Użytkownik %s nie ma roli 'admin'.", userUsosID)
			utils.SendError(c, http.StatusForbidden, "Brak uprawnień administratora")
			return
		}

		log.Println("AdminRequired: SUCCESS. Użytkownik jest adminem.")
		c.Next() // Użytkownik jest adminem, kontynuuj
	}
}

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
