package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	// Use correct module path
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

const requestTokenSecretKey = "oauth_request_secret"

func HandleUsosLogin(c *gin.Context) {
	requiredScopes := []string{"studies", "email" /* Add other scopes */}

	// Ignore the requestToken key using "_"
	redirectURL, _, requestSecret, err := services.GetAuthorizationURLAndSecret(requiredScopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate OAuth flow", "details": err.Error()})
		return
	}

	// Store the secret in session
	session := sessions.Default(c)
	session.Set(requestTokenSecretKey, requestSecret)
	if err := session.Save(); err != nil { /* ... error handling ... */
	}

	log.Printf("Redirecting user to USOS authorize URL...")
	c.Redirect(http.StatusFound, redirectURL)
}

func HandleUsosCallback(c *gin.Context) {
	requestTokenKey := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	if requestTokenKey == "" || verifier == "" { /* ... error handling ... */
	}

	// Retrieve the secret from the session
	session := sessions.Default(c)
	requestTokenSecretValue := session.Get(requestTokenSecretKey)
	if requestTokenSecretValue == nil { /* ... error handling ... */
	}
	requestTokenSecret, ok := requestTokenSecretValue.(string)
	if !ok || requestTokenSecret == "" { /* ... error handling ... */
	}
	session.Delete(requestTokenSecretKey) // Clear secret

	log.Println("Handling USOS callback, exchanging token...")
	userToken, err := services.ExchangeTokenAndStore(c, requestTokenKey, requestTokenSecret, verifier)
	if err != nil {
		session.Save()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token", "details": err.Error()})
		return
	}
	if userToken == nil || userToken.UserUsosID == "" {
		session.Save()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange successful but user ID is missing"})
		return
	}

	// Store User ID in Backend Session
	session.Set("user_usos_id", userToken.UserUsosID)
	session.Options(sessions.Options{Path: "/", MaxAge: 3600 * 24 * 7, HttpOnly: true /*, Secure: true, SameSite: http.SameSiteLaxMode */})
	if err := session.Save(); err != nil {
		log.Printf("Failed to save user session after login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user session"})
		return
	}

	log.Printf("User %s authenticated successfully via USOS. Redirecting to frontend.", userToken.UserUsosID)
	c.Redirect(http.StatusFound, config.AppConfig.FrontendURL+"/dashboard") // Adjust path if needed
}

// Optional: Logout handler
// func HandleLogout(c *gin.Context) { /* ... */ }
