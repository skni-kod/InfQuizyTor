package utils

import (
	"log"
	"net/http" // <--- 1. DODAJ TEN IMPORT

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

// --- 2. DODAJ CAŁĄ TĘ FUNKCJĘ ---

// SendInternalError to ujednolicona funkcja do obsługi błędów 500.
// Loguje pełny błąd (err) na serwerze, ale wysyła użytkownikowi
// tylko generyczną wiadomość.
func SendInternalError(c *gin.Context, err error) {
	log.Printf("Błąd wewnętrzny (HTTP 500): %v", err)
	SendError(c, http.StatusInternalServerError, "Wystąpił wewnętrzny błąd serwera")
}
