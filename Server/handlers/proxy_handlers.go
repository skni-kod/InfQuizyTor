package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func HandleApiProxy(c *gin.Context) {
	log.Printf("DEBUG: HandleApiProxy called for raw path: %s", c.Request.URL.Path)

	var targetPath string
	if strings.HasPrefix(c.Request.URL.Path, "/api/") {
		targetPath = strings.TrimPrefix(c.Request.URL.Path, "/api/")
	} else {
		log.Printf("BŁĄD: HandleApiProxy otrzymał ścieżkę bez /api/: %s", c.Request.URL.Path)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid proxy path"})
		return
	}

	cleanTargetPath := strings.TrimPrefix(targetPath, "/")
	log.Printf("DEBUG: Poprawnie wyodrębniona ścieżka docelowa (cleanTargetPath): %s", cleanTargetPath)

	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		log.Println("BŁĄD: Brak user_usos_id w kontekście middleware")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context (proxy)"})
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID in context (proxy)"})
		return
	}

	log.Printf("HandleApiProxy: User ID '%s' retrieved from context.", userUsosID)
	queryParams := c.Request.URL.Query()
	log.Printf("HandleApiProxy: Proxying request for user %s to path %s with query %s", userUsosID, cleanTargetPath, queryParams.Encode())

	statusCode, responseBody, responseHeaders, err := services.ProxyUsosApiRequest(c, userUsosID, cleanTargetPath, queryParams)

	if err != nil {
		log.Printf("Error during API proxy for user %s, path %s: %v", userUsosID, cleanTargetPath, err)
		c.JSON(statusCode, gin.H{"error": "Failed to proxy request to USOS API", "details": err.Error()})
		return
	}

	contentType := responseHeaders.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json"
		log.Printf("Warning: Content-Type header missing from USOS API response for %s. Assuming JSON.", cleanTargetPath)
	}
	log.Printf("Proxy successful for user %s, path %s. Status: %d, Content-Type: %s", userUsosID, cleanTargetPath, statusCode, contentType)
	c.Data(statusCode, contentType, responseBody)
}
