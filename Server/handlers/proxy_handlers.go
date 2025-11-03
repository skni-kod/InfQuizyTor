// ZMIANA: Poprawna nazwa pakietu
package handlers

import (
	"log"
	"net/http" // Potrzebny do url.Values
	"strings"

	"github.com/gin-gonic/gin"
	// Poprawna ścieżka do pakietu services
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func HandleApiProxy(c *gin.Context) {
	log.Printf("DEBUG: HandleApiProxy called for path: %s", c.Request.URL.Path)
	proxyPathParam := c.Param("proxyPath")
	log.Printf("DEBUG: Extracted proxyPath parameter: %s", proxyPathParam)

	// Pobierz ID użytkownika z kontekstu (ustawione przez middleware)
	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID in context"})
		return
	}

	// Użyj parametru proxyPath jako ścieżki docelowej
	// Zakładamy, że zawiera on część ścieżki po /api/, np. "/services/calendar/user_events"
	targetPath := proxyPathParam
	// Usuń wiodący '/' jeśli jest, aby uniknąć podwójnego // w URL
	cleanTargetPath := strings.TrimPrefix(targetPath, "/")

	// Pobierz parametry zapytania z oryginalnego żądania
	queryParams := c.Request.URL.Query()

	log.Printf("Proxying request for user %s to path: %s", userUsosID, cleanTargetPath)

	// Wywołaj funkcję serwisu, która wykona podpisane żądanie do USOS API
	// Przekaż kontekst gin, ID użytkownika, czystą ścieżkę i parametry
	statusCode, responseBody, responseHeaders, err := services.ProxyUsosApiRequest(c, userUsosID, cleanTargetPath, queryParams)

	if err != nil {
		// Błąd podczas proxy - statusCode jest ustawiany w ProxyUsosApiRequest
		log.Printf("Error during API proxy for user %s, path %s: %v", userUsosID, cleanTargetPath, err)
		c.JSON(statusCode, gin.H{"error": "Failed to proxy request to USOS API", "details": err.Error()})
		return
	}

	// Przekaż odpowiedź z USOS API do frontendu
	contentType := responseHeaders.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json" // Domyślny Content-Type
		log.Printf("Warning: Content-Type header missing from USOS API response for %s. Assuming JSON.", cleanTargetPath)
	}
	log.Printf("Proxy successful for user %s, path %s. Status: %d, Content-Type: %s", userUsosID, cleanTargetPath, statusCode, contentType)
	c.Data(statusCode, contentType, responseBody)
}
