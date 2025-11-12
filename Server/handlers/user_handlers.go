package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db" // Importuj pakiet db
)

func HandleGetUserMe(c *gin.Context) {
	log.Println("--- HandleGetUserMe: START ---")

	// Używamy "user_usos_id" (lub cokolwiek ustawiłeś w middleware)
	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		log.Println("HandleGetUserMe: FAILED. 'user_usos_id' NOT FOUND in Gin context.")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context (me)"})
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID in context (me)"})
		return
	}

	// --- POPRAWKA ---
	// Używamy publicznej zmiennej `db.UserRepository`
	user, err := db.UserRepository.GetUserByUsosID(userUsosID)
	if err != nil {
		log.Printf("HandleGetUserMe: FAILED. User %s not found in DB: %v", userUsosID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Nie znaleziono użytkownika w bazie danych"})
		return
	}

	log.Printf("HandleGetUserMe: SUCCESS. Returning user %s from DB.", userUsosID)
	log.Println("--- HandleGetUserMe: END ---")

	c.JSON(http.StatusOK, gin.H{
		"id":         user.UsosID,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"email":      user.Email,
	})
}
