package middleware

import (
	"log"
	"net/http"

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
