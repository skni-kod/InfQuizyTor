package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleUsosLogin inicjuje proces OAuth
func HandleUsosLogin(c *gin.Context) {
	session := sessions.Default(c)

	// 1. Pobierz Request Token z USOS API
	requestToken, requestSecret, err := services.UsosService.GetRequestToken()
	if err != nil {
		log.Printf("Błąd GetRequestToken: %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Nie można połączyć się z USOS")
		return
	}

	// 2. Zapisz sekret w sesji (potrzebny do wymiany na Access Token)
	session.Set("request_secret", requestSecret)
	if err := session.Save(); err != nil {
		log.Printf("Błąd zapisu sesji (request_secret): %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Błąd wewnętrzny serwera")
		return
	}

	// 3. Wygeneruj URL do autoryzacji dla użytkownika
	authURL, err := services.UsosService.GetAuthorizationURL(requestToken)
	if err != nil {
		log.Printf("Błąd GetAuthorizationURL: %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Błąd generowania URL autoryzacji")
		return
	}

	// Zwróć URL do frontend-u, aby przekierował użytkownika
	c.JSON(http.StatusOK, gin.H{"authorization_url": authURL.String()})
}

// HandleUsosCallback obsługuje powrót użytkownika z USOS
func HandleUsosCallback(c *gin.Context) {
	session := sessions.Default(c)
	
	// Pobierz parametry z URL
	requestToken := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")
	frontendURL := services.UsosService.FrontendURL // Upewnij się, że to jest zdefiniowane w serwisie

	// 1. Odzyskaj sekret z sesji
	requestSecretValue := session.Get("request_secret")
	if requestSecretValue == nil {
		log.Println("Błąd: brak request_secret w sesji (sesja wygasła lub błędne żądanie)")
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=session_expired", frontendURL))
		return
	}
	requestSecret := requestSecretValue.(string)

	// 2. Wymień Request Token na Access Token
	accessToken, accessSecret, err := services.UsosService.GetAccessToken(requestToken, requestSecret, verifier)
	if err != nil {
		log.Printf("Błąd wymiany Access Tokena: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=auth_failed", frontendURL))
		return
	}

	// 3. Pobierz dane użytkownika używając nowego Access Tokena
	userInfo, err := services.UsosService.GetUserInfo(accessToken, accessSecret)
	if err != nil {
		log.Printf("Błąd pobierania danych użytkownika: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=user_info_failed", frontendURL))
		return
	}

	// 4. Zapisz/Zaktualizuj użytkownika w bazie (UPSERT)
	user := &models.User{
		UsosID:    userInfo.ID,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Email:     userInfo.Email,
	}
	if err := db.UserRepository.CreateOrUpdateUser(user); err != nil {
		log.Printf("Błąd zapisu użytkownika do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_error", frontendURL))
		return
	}

	// 5. Zapisz/Zaktualizuj TOKEN w bazie (To jest kluczowe dla odświeżania tokena!)
	token := &models.Token{
		UserUsosID:   userInfo.ID,
		AccessToken:  accessToken,
		AccessSecret: accessSecret,
		Scopes:       services.UsosService.Scopes, // Pobierz scopes z serwisu
	}
	
	// Tutaj wywołujemy funkcję, która musi obsługiwać nadpisywanie starego tokena
	if err := db.UserRepository.SaveToken(token); err != nil {
		log.Printf("Błąd zapisu tokena do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_error", frontendURL))
		return
	}

	// 6. Ustaw sesję użytkownika (zaloguj go w naszej aplikacji)
	session.Set("user_usos_id", userInfo.ID)
	session.Delete("request_secret") // Wyczyść tymczasowy sekret
	if err := session.Save(); err != nil {
		log.Printf("Błąd zapisu sesji końcowej: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=session_save_failed", frontendURL))
		return
	}

	log.Printf("Użytkownik %s (%s %s) pomyślnie zalogowany i token odświeżony.", userInfo.ID, userInfo.FirstName, userInfo.LastName)

	// Przekieruj na dashboard frontendu
	c.Redirect(http.StatusFound, frontendURL)
}

// HandleLogout wylogowuje użytkownika
func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	userUsosID := session.Get("user_usos_id")
	
	if userUsosID != nil {
		log.Printf("Wylogowywanie użytkownika: %v", userUsosID)
	}

	session.Clear() // Czyści wszystkie klucze
	session.Options(sessions.Options{MaxAge: -1}) // Usuwa ciasteczko
	session.Save()
	
	utils.SendSuccess(c, http.StatusOK, gin.H{"message": "Wylogowano pomyślnie"})
}