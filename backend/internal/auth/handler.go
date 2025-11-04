package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db" // Dodaj import DB
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

const requestTokenSecretKey = "oauth_request_secret"
const requestedScopesKey = "oauth_requested_scopes" // Klucz do zapisu scopes w sesji

func HandleUsosLogin(c *gin.Context) {
	// Poproś o uprawnienia 'studies', które były wymagane
	requiredScopes := []string{"studies", "email", "grades", "crstests"}
	redirectURL, _, requestSecret, err := services.GetAuthorizationURLAndSecret(requiredScopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate OAuth flow", "details": err.Error()})
		return
	}

	session := sessions.Default(c)
	session.Set(requestTokenSecretKey, requestSecret)
	session.Set(requestedScopesKey, requiredScopes) // Zapisz scopes do sesji
	if err := session.Save(); err != nil {
		log.Printf("Failed to save request secret/scopes to session: %v", err)
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

	requestedScopesValue := session.Get(requestedScopesKey)
	requestedScopes, _ := requestedScopesValue.([]string) // Odczytaj scopes

	session.Delete(requestTokenSecretKey)
	session.Delete(requestedScopesKey) // Wyczyść scopes z sesji

	log.Println("Handling USOS callback, exchanging token...")
	// Przekaż scopes do funkcji wymiany
	userToken, err := services.ExchangeTokenAndStore(c, requestTokenKey, requestTokenSecret, verifier, requestedScopes)
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

	session.Set("user_usos_id", userToken.UserUsosID)
	session.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600 * 24 * 7,
		HttpOnly: true,
	})
	if err := session.Save(); err != nil {
		log.Printf("Failed to save user session after login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user session"})
		return
	}

	log.Printf("User %s authenticated successfully via USOS. Redirecting to frontend.", userToken.UserUsosID)
	c.Redirect(http.StatusFound, config.AppConfig.FrontendURL+"/dashboard")
}

func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	userUsosIDValue, exists := c.Get("user_usos_id")

	if exists {
		userUsosID, ok := userUsosIDValue.(string)
		if ok {
			err := db.DeleteUserToken(c.Request.Context(), userUsosID)
			if err != nil {
				log.Printf("Błąd podczas usuwania tokena użytkownika %s z bazy danych: %v", userUsosID, err)
			} else {
				log.Printf("Token dla użytkownika %s został usunięty z bazy danych.", userUsosID)
			}
		}

		session.Delete("user_usos_id")
		session.Options(sessions.Options{MaxAge: -1})

		if err := session.Save(); err != nil {
			log.Printf("Błąd podczas zapisywania zniszczonej sesji dla użytkownika %s: %v", userUsosID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
			return
		}

		log.Printf("Użytkownik %s wylogowany (sesja zniszczona).", userUsosID)
		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	} else {
		log.Println("Wylogowanie wywołane dla użytkownika bez aktywnej sesji.")
		c.JSON(http.StatusOK, gin.H{"message": "No active session found."})
	}
}
