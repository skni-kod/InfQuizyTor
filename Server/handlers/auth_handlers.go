package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

const requestTokenSecretKey = "oauth_request_secret"

func HandleUsosLogin(c *gin.Context) {
	requiredScopes := []string{"studies", "email", "grades", "crstests"} // Przykładowe scopes

	// POPRAWKA: Użyj '_' aby zignorować nieużywaną zmienną 'requestToken'
	redirectURL, _, requestSecret, err := services.GetAuthorizationURLAndSecret(requiredScopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate OAuth flow", "details": err.Error()})
		return
	}

	session := sessions.Default(c)
	session.Set(requestTokenSecretKey, requestSecret)
	if err := session.Save(); err != nil {
		log.Printf("Failed to save request secret to session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
		return
	}

	log.Printf("Redirecting user to USOS authorize URL...")
	c.Redirect(http.StatusFound, redirectURL)
}

func HandleUsosCallback(c *gin.Context) {
	requestTokenKey := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	if requestTokenKey == "" || verifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing oauth_token or oauth_verifier in callback"})
		return
	}

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
	session.Delete(requestTokenSecretKey) // Usuń sekret z sesji

	log.Println("Handling USOS callback, exchanging token...")
	userToken, err := services.ExchangeTokenAndStore(c, requestTokenKey, requestTokenSecret, verifier)
	if err != nil {
		session.Save() // Zapisz sesję (aby usunąć sekret) nawet przy błędzie
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token", "details": err.Error()})
		return
	}

	if userToken == nil || userToken.UserUsosID == "" {
		session.Save()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange successful but user ID is missing"})
		return
	}

	// Zapisz ID użytkownika w sesji backendu
	session.Set("user_usos_id", userToken.UserUsosID)
	session.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600 * 24 * 7, // 1 tydzień
		HttpOnly: true,
		// Secure: true, // Włącz w produkcji (HTTPS)
		// SameSite: http.SameSiteLaxMode,
	})
	if err := session.Save(); err != nil {
		log.Printf("Failed to save user session after login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user session"})
		return
	}

	log.Printf("User %s authenticated successfully via USOS. Redirecting to frontend.", userToken.UserUsosID)
	c.Redirect(http.StatusFound, config.AppConfig.FrontendURL+"/dashboard") // Dostosuj ścieżkę frontendu
}
