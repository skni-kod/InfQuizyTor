package handlers

import (
	"fmt" // 1. Dodaj import 'fmt'
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleUsosLogin (poprawiony, aby zwracał JSON)
func HandleUsosLogin(c *gin.Context) {
	session := sessions.Default(c)

	requestToken, requestSecret, err := services.UsosService.GetRequestToken()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Nie można połączyć się z USOS")
		return
	}

	session.Set("request_secret", requestSecret)
	if err := session.Save(); err != nil {
		log.Printf("Błąd zapisu sesji (request_secret): %v", err)
		utils.SendError(c, http.StatusInternalServerError, fmt.Errorf("błąd zapisu sesji: %w", err).Error())
		return
	}

	authURL, err := services.UsosService.GetAuthorizationURL(requestToken)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd generowania URL autoryzacji")
		return
	}

	// Zwracamy JSON, którego oczekuje Twój frontend
	c.JSON(http.StatusOK, gin.H{"authorization_url": authURL.String()})
}

// HandleUsosCallback (POPRAWIONE PRZEKIEROWANIA)
func HandleUsosCallback(c *gin.Context) {
	session := sessions.Default(c)
	requestToken := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	// --- 2. Pobieramy URL frontendu z serwisu ---
	frontendURL := services.UsosService.FrontendURL

	requestSecretValue := session.Get("request_secret")
	if requestSecretValue == nil {
		log.Println("Błąd krytyczny: brak request_secret w sesji")
		// --- POPRAWKA PRZEKIEROWANIA ---
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=session_expired", frontendURL))
		return
	}
	requestSecret := requestSecretValue.(string)

	accessToken, accessSecret, err := services.UsosService.GetAccessToken(requestToken, requestSecret, verifier)
	if err != nil {
		log.Printf("Błąd wymiany Access Tokena: %v", err)
		// --- POPRAWKA PRZEKIEROWANIA ---
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=auth_failed", frontendURL))
		return
	}

	// Teraz to żądanie POWINNO SIĘ UDAĆ
	userInfo, err := services.UsosService.GetUserInfo(accessToken, accessSecret)
	if err != nil {
		log.Printf("Błąd pobierania danych użytkownika: %v", err)
		// --- POPRAWKA PRZEKIEROWANIA ---
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=user_info_failed", frontendURL))
		return
	}

	user := &models.User{
		UsosID:    userInfo.ID,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Email:     userInfo.Email,
	}
	if err := db.UserRepository.CreateOrUpdateUser(user); err != nil {
		log.Printf("Błąd zapisu użytkownika do DB: %v", err)
		// --- POPRAWKA PRZEKIEROWANIA ---
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_user_failed", frontendURL))
		return
	}

	token := &models.Token{
		UserUsosID:   userInfo.ID,
		AccessToken:  accessToken,
		AccessSecret: accessSecret,
		Scopes:       services.UsosService.Scopes,
	}
	if err := db.UserRepository.SaveToken(token); err != nil {
		log.Printf("Błąd zapisu tokena do DB: %v", err)
		// --- POPRAWKA PRZEKIEROWANIA ---
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_token_failed", frontendURL))
		return
	}

	session.Set("user_usos_id", userInfo.ID)
	session.Delete("request_secret")
	session.Save()

	log.Printf("Użytkownik %s (%s) pomyślnie zalogowany.", userInfo.ID, userInfo.FirstName)

	// --- POPRAWKA PRZEKIEROWANIA (SUKCES) ---
	c.Redirect(http.StatusFound, frontendURL)
}

// HandleLogout (bez zmian)
func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{MaxAge: -1})
	session.Save()
	utils.SendSuccess(c, http.StatusOK, gin.H{"message": "Wylogowano pomyślnie"})
}
