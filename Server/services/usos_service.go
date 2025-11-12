package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"

	// Importujemy 'strings'
	"github.com/dghubble/oauth1"
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
)

var UsosService *GormUsosService

type GormUsosService struct {
	Config     *oauth1.Config
	UsosAPIURL string
	UserRepo   *db.GormUserRepository
}

func InitUsosService(cfg config.Config) {
	usosEndpoint := oauth1.Endpoint{
		RequestTokenURL: cfg.UsosRequestTokenURL,
		AuthorizeURL:    cfg.UsosAuthorizeURL,
		AccessTokenURL:  cfg.UsosAccessTokenURL,
	}

	UsosService = &GormUsosService{
		Config: &oauth1.Config{
			ConsumerKey:    cfg.UsosConsumerKey,
			ConsumerSecret: cfg.UsosConsumerSecret,
			CallbackURL:    cfg.UsosCallbackURL,
			Endpoint:       usosEndpoint,
			// --- POPRAWKA ---
			// Usunęliśmy pole 'Scopes' stąd, ponieważ nie jest wspierane
		},
		UsosAPIURL: cfg.UsosApiBaseURL,
		UserRepo:   db.UserRepository,
	}

	log.Println("Serwis USOS pomyślnie zainicjowany.")
}

func (s *GormUsosService) GetRequestToken() (string, string, error) {
	return s.Config.RequestToken()
}

// --- POPRAWKA TUTAJ ---
// Modyfikujemy tę funkcję, aby ręcznie dodawała 'scopes' do URL-a
func (s *GormUsosService) GetAuthorizationURL(requestToken string) (*url.URL, error) {
	authURL, err := s.Config.AuthorizationURL(requestToken)
	if err != nil {
		return nil, err
	}

	// USOS wymaga 'scopes' jako parametru w URL autoryzacji
	// Używamy stringa rozdzielonego | (pipe)
	scopes := "studies|email|grades|crstests|cards"

	q := authURL.Query()
	q.Set("scopes", scopes)
	authURL.RawQuery = q.Encode()

	log.Printf("Wygenerowano Authorization URL z uprawnieniami: %s", scopes)
	return authURL, nil
}

// --- KONIEC POPRAWKI ---

func (s *GormUsosService) GetAccessToken(requestToken, requestSecret, verifier string) (string, string, error) {
	// Teraz poprawnie przekazujemy requestSecret
	return s.Config.AccessToken(requestToken, requestSecret, verifier)
}

func (s *GormUsosService) GetUserInfo(accessToken, accessSecret string) (*models.UsosUserInfo, error) {
	httpClient := s.Config.Client(oauth1.NoContext, oauth1.NewToken(accessToken, accessSecret))
	url := fmt.Sprintf("%s/services/users/user?fields=id|first_name|last_name|email", s.UsosAPIURL)
	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("błąd pobierania danych użytkownika: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Błąd odpowiedzi USOS (GetUserInfo): Status %d, Body: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("błąd API USOS: status %d", resp.StatusCode)
	}

	var userInfo models.UsosUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON użytkownika: %w", err)
	}
	return &userInfo, nil
}

func (s *GormUsosService) MakeSignedRequest(userUsosID, targetPath, queryParams string) (*http.Response, error) {
	log.Printf("Proxy: Pobieranie tokena dla użytkownika %s", userUsosID)
	token, err := s.UserRepo.GetTokenByUsosID(userUsosID)
	if err != nil {
		log.Printf("Proxy: Błąd pobierania tokena: %v", err)
		return nil, fmt.Errorf("błąd pobierania tokena z bazy: %w", err)
	}
	log.Printf("Proxy: Pomyślnie pobrano token dla użytkownika %s", userUsosID)

	oauthToken := oauth1.NewToken(token.AccessToken, token.AccessSecret)
	httpClient := s.Config.Client(oauth1.NoContext, oauthToken)

	// Usuwamy potencjalny '?' na końcu, jeśli queryParams są puste
	url := fmt.Sprintf("%s/services/%s", s.UsosAPIURL, targetPath)
	if queryParams != "" {
		url = fmt.Sprintf("%s?%s", url, queryParams)
	}

	log.Printf("Proxy: Wykonywanie podpisanego żądania GET do: %s", url)

	resp, err := httpClient.Get(url)
	if err != nil {
		log.Printf("Proxy: Błąd żądania GET do USOS: %v", err)
		return nil, fmt.Errorf("błąd żądania do API USOS: %w", err)
	}

	// Zwracamy odpowiedź bez zamykania body
	return resp, nil
}
