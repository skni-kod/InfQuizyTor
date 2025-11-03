package handlers // Upewnij się, że ta linia to 'package handlers'

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func HandleApiProxy(c *gin.Context) {
	log.Printf("DEBUG: HandleApiProxy called for path: %s", c.Request.URL.Path)
	proxyPathParam := c.Param("proxyPath")
	log.Printf("DEBUG: Extracted proxyPath parameter: %s", proxyPathParam)

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

	targetPath := proxyPathParam
	cleanTargetPath := strings.TrimPrefix(targetPath, "/")
	queryParams := c.Request.URL.Query()

	log.Printf("Proxying request for user %s to path: %s", userUsosID, cleanTargetPath)

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
