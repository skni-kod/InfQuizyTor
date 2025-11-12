package utils

import (
	"log"

	"github.com/gin-gonic/gin"
)

// SendError to ujednolicona funkcja do wysyłania błędów HTTP.
func SendError(c *gin.Context, statusCode int, message string) {
	log.Printf("Błąd (HTTP %d): %s", statusCode, message)
	c.AbortWithStatusJSON(statusCode, gin.H{"error": message})
}

// SendSuccess to ujednolicona funkcja do wysyłania pomyślnych odpowiedzi.
func SendSuccess(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, data)
}
