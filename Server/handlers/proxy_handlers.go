package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/services" // Adjust path
)

func HandleApiProxy(c *gin.Context) {
	// Get user ID stored by the AuthRequired middleware
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

	// Extract the target USOS API path from the URL
	// Example: If request is /api/calendar/user_events, targetPath should be "services/calendar/user_events"
	targetPath := strings.TrimPrefix(c.Param("proxyPath"), "/")
	if !strings.HasPrefix(targetPath, "services/") {
		log.Printf("Proxy Warning: Requested path '%s' does not start with 'services/'. Assuming it's the full path.", targetPath)
		// Or return bad request:
		// c.JSON(http.StatusBadRequest, gin.H{"error": "Proxied path must start with /services/"})
		// return
	}

	// Pass through query parameters from the frontend request
	queryParams := c.Request.URL.Query()

	log.Printf("Proxying request for user %s to path: %s", userUsosID, targetPath)

	// Call the service function to make the signed request
	statusCode, responseBody, responseHeaders, err := services.ProxyUsosApiRequest(c, userUsosID, targetPath, queryParams)

	if err != nil {
		// Error occurred during proxying, return appropriate status
		// Status code is already set in the error handling of ProxyUsosApiRequest
		c.JSON(statusCode, gin.H{"error": "Failed to proxy request to USOS API", "details": err.Error()})
		return
	}

	// Forward the response from USOS API to the frontend
	// Set Content-Type based on USOS response
	contentType := responseHeaders.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json" // Default assumption
	}
	c.Data(statusCode, contentType, responseBody)
}
