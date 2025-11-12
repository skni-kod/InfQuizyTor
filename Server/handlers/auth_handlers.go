package handlers

import (
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

func HandleUsosLogin(c *gin.Context) {
	session := sessions.Default(c)
	requestToken, requestSecret, err := services.UsosService.GetRequestToken()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Nie można połączyć się z USOS")
		return
	}

	session.Set("request_secret", requestSecret)
	session.Save()

	authURL, err := services.UsosService.GetAuthorizationURL(requestToken)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd generowania URL autoryzacji")
		return
	}
	c.Redirect(http.StatusFound, authURL.String())
}

func HandleUsosCallback(c *gin.Context) {
	session := sessions.Default(c)
	requestToken := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")

	requestSecretValue := session.Get("request_secret")
	if requestSecretValue == nil {
		log.Println("Błąd krytyczny: brak request_secret w sesji")
		utils.SendError(c, http.StatusInternalServerError, "Sesja wygasła podczas logowania")
		return
	}
	requestSecret := requestSecretValue.(string)

	accessToken, accessSecret, err := services.UsosService.GetAccessToken(requestToken, requestSecret, verifier)
	if err != nil {
		log.Printf("Błąd wymiany Access Tokena: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=auth_failed")
		return
	}

	userInfo, err := services.UsosService.GetUserInfo(accessToken, accessSecret)
	if err != nil {
		log.Printf("Błąd pobierania danych użytkownika: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=user_info_failed")
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
		c.Redirect(http.StatusTemporaryRedirect, "/?error=db_user_failed")
		return
	}

	token := &models.Token{
		UserUsosID:   userInfo.ID,
		AccessToken:  accessToken,
		AccessSecret: accessSecret,
		// Poprawnie pobieramy scopes z serwisu
		Scopes: services.UsosService.Scopes,
	}
	if err := db.UserRepository.SaveToken(token); err != nil {
		log.Printf("Błąd zapisu tokena do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=db_token_failed")
		return
	}

	session.Set("user_usos_id", userInfo.ID)
	session.Delete("request_secret")
	session.Save()

	log.Printf("Użytkownik %s (%s) pomyślnie zalogowany.", userInfo.ID, userInfo.FirstName)
	c.Redirect(http.StatusFound, "http://localhost:5173/")
}

func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{MaxAge: -1})
	session.Save()
	utils.SendSuccess(c, http.StatusOK, gin.H{"message": "Wylogowano pomyślnie"})
}
