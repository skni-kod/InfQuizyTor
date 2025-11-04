package handlers

import (
	"log"
	"net/http"

	// Potrzebny do url.Values
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/services" // Upewnij się, że ścieżka modułu jest poprawna
)

// HandleGetUserMe obsługuje żądanie /api/users/me
// Działa jak proxy, ale specyficznie dla endpointu services/users/user
func HandleGetUserMe(c *gin.Context) {
	log.Println("--- HandleGetUserMe: START ---")

	// Pobierz ID użytkownika z kontekstu (ustawione przez middleware)
	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		log.Println("HandleGetUserMe: FAILED. 'user_usos_id' NOT FOUND in Gin context.")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context (me)"})
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		log.Printf("HandleGetUserMe: FAILED. 'user_usos_id' in context is invalid: %v", userUsosIDValue)
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID in context (me)"})
		return
	}

	// Definiujemy ścieżkę docelową i parametry (pola)
	targetPath := "services/users/user"
	queryParams := c.Request.URL.Query() // Przekaż parametry (np. ?fields=...) z frontendu
	if queryParams.Get("fields") == "" {
		// Ustaw domyślne pola, jeśli frontend nie podał
		queryParams.Set("fields", "id|first_name|last_name|email")
	}

	log.Printf("HandleGetUserMe: Proxying request for user %s to path %s", userUsosID, targetPath)

	// Użyj tej samej logiki proxy co w HandleApiProxy
	statusCode, responseBody, responseHeaders, err := services.ProxyUsosApiRequest(c, userUsosID, targetPath, queryParams)

	if err != nil {
		log.Printf("HandleGetUserMe: FAILED. Error from ProxyUsosApiRequest: %v", err)
		c.JSON(statusCode, gin.H{"error": "Failed to proxy request to USOS API (me)", "details": err.Error()})
		return
	}

	contentType := responseHeaders.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json"
	}

	log.Printf("HandleGetUserMe: SUCCESS. Status: %d", statusCode)
	log.Println("--- HandleGetUserMe: END ---")
	c.Data(statusCode, contentType, responseBody)
}
