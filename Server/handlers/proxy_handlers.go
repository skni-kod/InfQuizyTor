package handlers

import (
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/services" // Importuj pakiet services
)

func HandleApiProxy(c *gin.Context) {
	session := sessions.Default(c)
	userUsosIDValue := session.Get("user_usos_id") // Klucz musi być zgodny z tym, co ustawiasz w AuthRequired
	if userUsosIDValue == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Brak autoryzacji"})
		return
	}
	userUsosID := userUsosIDValue.(string)

	proxyPath := c.Param("proxyPath")
	queryParams := c.Request.URL.RawQuery

	// Wyczyść ścieżkę (usuń wiodący /)
	cleanPath := strings.TrimPrefix(proxyPath, "/")

	log.Printf("HandleApiProxy: Proxying request for user %s to path '%s'", userUsosID, cleanPath)

	// --- POPRAWKA ---
	// Użyj publicznej, zainicjowanej zmiennej z pakietu services
	resp, err := services.UsosService.MakeSignedRequest(userUsosID, cleanPath, queryParams)
	if err != nil {
		log.Printf("HandleApiProxy: Error from MakeSignedRequest: %v", err)
		// Sprawdź, czy odpowiedź nie jest nil, zanim zwrócisz status
		statusCode := http.StatusInternalServerError
		if resp != nil {
			statusCode = resp.StatusCode
		}
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	// Przekaż odpowiedź z USOS (JSON, błąd, cokolwiek) z powrotem do frontendu
	// Kopiujemy nagłówki i treść
	c.Status(resp.StatusCode)
	// Ustawiamy Content-Type, ponieważ GIN lubi go nadpisywać
	c.Header("Content-Type", resp.Header.Get("Content-Type"))

	io.Copy(c.Writer, resp.Body)
}
