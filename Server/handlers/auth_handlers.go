package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

func HandleUsosLogin(c *gin.Context) {
	session := sessions.Default(c)

	// Używamy publicznego serwisu
	requestToken, requestSecret, err := services.UsosService.GetRequestToken()
	if err != nil {
		log.Printf("Błąd pobierania Request Tokena: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Nie można połączyć się z USOS"})
		return
	}

	session.Set("request_secret", requestSecret)
	session.Save()

	authURL, err := services.UsosService.GetAuthorizationURL(requestToken)
	if err != nil {
		log.Printf("Błąd pobierania Authorization URL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd generowania URL autoryzacji"})
		return
	}

	c.Redirect(http.StatusFound, authURL.String())
}

func HandleUsosCallback(c *gin.Context) {
	session := sessions.Default(c)
	requestToken := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	// --- POCZĄTEK POPRAWKI ---
	// Pobieramy request_secret zapisany w sesji
	requestSecretValue := session.Get("request_secret")
	if requestSecretValue == nil {
		log.Println("Błąd krytyczny: brak request_secret w sesji")
		c.Redirect(http.StatusTemporaryRedirect, "/?error=session_expired")
		return
	}
	requestSecret := requestSecretValue.(string)
	// --- KONIEC POPRAWKI ---

	// --- POPRAWKA W WYWOŁANIU ---
	// Przekazujemy pobrany requestSecret jako drugi argument
	accessToken, accessSecret, err := services.UsosService.GetAccessToken(requestToken, requestSecret, verifier)
	if err != nil {
		// Ten log teraz poprawnie pokaże "Invalid signature"
		log.Printf("Błąd wymiany Access Tokena: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=auth_failed")
		return
	}

	// ... (reszta funkcji bez zmian - pobieranie UserInfo, zapis do DB) ...

	// Czyścimy request_secret z sesji po użyciu
	session.Delete("request_secret")
	session.Save()

	userInfo, err := services.UsosService.GetUserInfo(accessToken, accessSecret)
	if err != nil {
		log.Printf("Błąd pobierania danych użytkownika: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=user_info_failed")
		return
	}

	// Zapisz użytkownika w bazie
	user := &models.User{
		UsosID:    userInfo.ID,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Email:     userInfo.Email,
	}
	if err := db.UserRepository.CreateOrUpdateUser(user); err != nil {
		log.Printf("Błąd zapisu użytkownika do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=db_user_failed")
		return
	}

	// Zapisz token w bazie
	token := &models.Token{
		UserUsosID:   userInfo.ID,
		AccessToken:  accessToken,
		AccessSecret: accessSecret,
	}
	if err := db.UserRepository.SaveToken(token); err != nil {
		log.Printf("Błąd zapisu tokena do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=db_token_failed")
		return
	}

	// Zapisz ID użytkownika w sesji
	session.Set("user_usos_id", userInfo.ID)
	session.Save()

	log.Printf("Użytkownik %s (%s) pomyślnie zalogowany.", userInfo.ID, userInfo.FirstName)
	c.Redirect(http.StatusFound, "http://localhost:5173/") // Przekieruj na stronę główną frontendu
}

func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{MaxAge: -1}) // Usuń ciasteczko
	session.Save()
	c.JSON(http.StatusOK, gin.H{"message": "Wylogowano pomyślnie"})
}
