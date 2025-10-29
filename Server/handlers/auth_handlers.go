package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/config"   // Adjust path
	"github.com/skni-kod/InfQuizyTor/Server/services" // Adjust path
)

const requestTokenSecretKey = "oauth_request_secret" // Session key

func HandleUsosLogin(c *gin.Context) {
	requiredScopes := []string{"studies", "email" /* Add other needed scopes */}

	// Get URL and the temporary secret
	redirectURL, requestToken, requestSecret, err := services.GetAuthorizationURLAndSecret(requiredScopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate OAuth flow", "details": err.Error()})
		return
	}

	// Store the secret in the session
	session := sessions.Default(c)
	session.Set(requestTokenSecretKey, requestSecret)
	if err := session.Save(); err != nil {
		log.Printf("Failed to save request secret to session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
		return
	}

	log.Printf("Redirecting user to USOS authorize URL...  Request Token: %s", requestToken)
	c.Redirect(http.StatusFound, redirectURL)
}

func HandleUsosCallback(c *gin.Context) {
	requestTokenKey := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	if requestTokenKey == "" || verifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing oauth_token or oauth_verifier in callback"})
		return
	}

	// Retrieve the secret from the session
	session := sessions.Default(c)
	requestTokenSecretValue := session.Get(requestTokenSecretKey)
	if requestTokenSecretValue == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request token secret not found in session or session expired"})
		return
	}
	requestTokenSecret, ok := requestTokenSecretValue.(string)
	if !ok || requestTokenSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid request token secret format in session"})
		return
	}

	// Clear the secret from the session now that we've retrieved it
	session.Delete(requestTokenSecretKey)
	// We will save the session again after successful login or handle error

	log.Println("Handling USOS callback, exchanging token...")
	// Pass the retrieved secret to the exchange function
	userToken, err := services.ExchangeTokenAndStore(c, requestTokenKey, requestTokenSecret, verifier)
	if err != nil {
		session.Save() // Save session even on error to clear the secret
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token", "details": err.Error()})
		return
	}

	if userToken == nil || userToken.UserUsosID == "" {
		session.Save() // Save session to clear secret
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange successful but user ID is missing"})
		return
	}

	// Authentication Successful - Store User ID in Backend Session
	session.Set("user_usos_id", userToken.UserUsosID)
	session.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600 * 24 * 7, // 1 week
		HttpOnly: true,
		// Secure: true, // Enable in production with HTTPS
		// SameSite: http.SameSiteLaxMode,
	})
	if err := session.Save(); err != nil {
		log.Printf("Failed to save user session after login: %v", err)
		// User is technically logged in with USOS, but backend session failed
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user session"})
		return
	}

	log.Printf("User %s authenticated successfully via USOS. Redirecting to frontend.", userToken.UserUsosID)
	// Redirect back to the frontend
	c.Redirect(http.StatusFound, config.AppConfig.FrontendURL+"/dashboard") // Adjust frontend URL/path
}

// Optional: Logout handler (remains the same)
func HandleLogout(c *gin.Context) { /* ... */ }
