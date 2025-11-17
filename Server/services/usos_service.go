package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time" // Potrzebne dla http.Client

	"github.com/gomodule/oauth1/oauth" // Import 'gomodule' v0.2.0
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
)

var UsosService *GormUsosService

type GormUsosService struct {
	Client      *oauth.Client // Zgodnie z dokumentacją v0.2.0
	UsosAPIURL  string
	UserRepo    *db.GormUserRepository
	Scopes      string
	FrontendURL string
	CallbackURL string       // oauth.Client nie przechowuje CallbackURL
	HttpClient  *http.Client // Wymagany przez metody v0.2.0
}

func InitUsosService(cfg config.Config) {
	client := &oauth.Client{
		Credentials: oauth.Credentials{
			Token:  cfg.UsosConsumerKey,
			Secret: cfg.UsosConsumerSecret,
		},
		TemporaryCredentialRequestURI: cfg.UsosRequestTokenURL,
		ResourceOwnerAuthorizationURI: cfg.UsosAuthorizeURL,
		TokenRequestURI:               cfg.UsosAccessTokenURL,
	}

	scopes := "studies|email|grades|crstests|cards|mailclient"
	httpClient := &http.Client{Timeout: 10 * time.Second}

	UsosService = &GormUsosService{
		Client:      client,
		UsosAPIURL:  cfg.UsosApiBaseURL,
		UserRepo:    db.UserRepository,
		Scopes:      scopes,
		FrontendURL: cfg.FrontendURL,
		CallbackURL: cfg.UsosCallbackURL,
		HttpClient:  httpClient,
	}

	log.Println("Serwis USOS (gomodule v0.2.0) pomyślnie zainicjowany.")
}

// GetRequestToken (poprawny dla 'gomodule')
func (s *GormUsosService) GetRequestToken() (string, string, error) {
	additionalParams := url.Values{}
	additionalParams.Set("scopes", s.Scopes) // Dodajemy scopes jako parametr

	creds, err := s.Client.RequestTemporaryCredentials(
		s.HttpClient,
		s.CallbackURL,
		additionalParams,
	)
	if err != nil {
		log.Printf("Błąd USOS (RequestToken): %v", err)
		return "", "", fmt.Errorf("błąd pobierania Request Tokena: %w", err)
	}
	return creds.Token, creds.Secret, nil
}

// GetAuthorizationURL (poprawny dla 'gomodule')
func (s *GormUsosService) GetAuthorizationURL(requestToken string) (*url.URL, error) {
	tempCreds := &oauth.Credentials{Token: requestToken}
	urlString := s.Client.AuthorizationURL(tempCreds, nil)
	return url.Parse(urlString)
}

// GetAccessToken (poprawny dla 'gomodule')
func (s *GormUsosService) GetAccessToken(requestToken, requestSecret, verifier string) (string, string, error) {
	tempCreds := &oauth.Credentials{
		Token:  requestToken,
		Secret: requestSecret,
	}
	creds, _, err := s.Client.RequestToken(
		s.HttpClient,
		tempCreds,
		verifier,
	)
	if err != nil {
		return "", "", fmt.Errorf("błąd wymiany Access Tokena: %w", err)
	}
	return creds.Token, creds.Secret, nil
}

// GetUserInfo (NAPRAWIONY - błąd "url must not contain query string")
func (s *GormUsosService) GetUserInfo(accessToken, accessSecret string) (*models.UsosUserInfo, error) {
	accessCreds := &oauth.Credentials{
		Token:  accessToken,
		Secret: accessSecret,
	}

	fields := "id|first_name|last_name|email"

	// 1. URL jest teraz "czysty", bez parametrów
	baseURL := fmt.Sprintf("%s/services/users/user", s.UsosAPIURL)

	// 2. Parametry (fields i scopes) są przekazywane osobno
	params := url.Values{}
	params.Set("fields", fields)
	params.Set("scopes", s.Scopes)

	// 3. Używamy s.Client.Get z 4 argumentami
	resp, err := s.Client.Get(
		s.HttpClient,
		accessCreds,
		baseURL,
		params, // Parametry przekazujemy tutaj
	)

	if err != nil {
		// Tutaj właśnie pojawiał się błąd "oauth: url must not contain a query string"
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

// MakeSignedRequest (NAPRAWIONY - błąd "url must not contain query string")
func (s *GormUsosService) MakeSignedRequest(userUsosID, targetPath, queryParams string) (*http.Response, error) {
	log.Printf("Proxy: Pobieranie tokena dla użytkownika %s", userUsosID)
	token, err := s.UserRepo.GetTokenByUsosID(userUsosID)
	if err != nil {
		log.Printf("Proxy: Błąd pobierania tokena: %v", err)
		return nil, fmt.Errorf("błąd pobierania tokena z bazy: %w", err)
	}

	accessCreds := &oauth.Credentials{
		Token:  token.AccessToken,
		Secret: token.AccessSecret,
	}

	baseURL := fmt.Sprintf("%s/services/%s", s.UsosAPIURL, targetPath)
	params, _ := url.ParseQuery(queryParams)

	// Dodajemy 'scopes' do parametrów
	params.Set("scopes", token.Scopes)

	log.Printf("Proxy: Wykonywanie podpisanego żądania GET do: %s", baseURL)

	resp, err := s.Client.Get(
		s.HttpClient,
		accessCreds,
		baseURL,
		params,
	)
	if err != nil {
		log.Printf("Proxy: Błąd żądania GET do USOS: %v", err)
		return nil, fmt.Errorf("błąd żądania do API USOS: %w", err)
	}

	return resp, nil
}
