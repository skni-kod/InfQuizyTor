package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"

	// --- POPRAWKA IMPORTU ---
	"github.com/gomodule/oauth1/oauth" // Używamy biblioteki 'gomodule'
	// --- KONIEC POPRAWKI ---

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
)

var UsosService *GormUsosService

type GormUsosService struct {
	Client      *oauth.Client // Zmieniono Config na Client
	UsosAPIURL  string
	UserRepo    *db.GormUserRepository
	Scopes      string
	CallbackURL string
}

func InitUsosService(cfg config.Config) {
	scopes := "studies|email|grades|crstests|cards|mailclient"

	// --- POPRAWKA: Używamy struktury 'Client' z 'gomodule' ---
	client := &oauth.Client{
		Credentials: oauth.Credentials{
			Token:  cfg.UsosConsumerKey,
			Secret: cfg.UsosConsumerSecret,
		},
		TemporaryCredentialRequestURI: cfg.UsosRequestTokenURL,
		ResourceOwnerAuthorizationURI: cfg.UsosAuthorizeURL,
		TokenRequestURI:               cfg.UsosAccessTokenURL,
		SignatureMethod:               oauth.HMACSHA1, // Domyślna dla USOS
	}
	// --- KONIEC POPRAWKI ---

	UsosService = &GormUsosService{
		Client:      client, // Zapisujemy Client
		UsosAPIURL:  cfg.UsosApiBaseURL,
		UserRepo:    db.UserRepository,
		Scopes:      scopes,
		CallbackURL: cfg.UsosCallbackURL,
	}

	log.Println("Serwis USOS pomyślnie zainicjowany.")
}

// --- POPRAWKA: Używamy metod z 'gomodule/oauth1' ---
func (s *GormUsosService) GetRequestToken() (string, string, error) {
	// Musimy dodać 'scopes' jako parametr dodatkowy
	params := url.Values{}
	params.Set("scopes", s.Scopes)

	// Używamy metody 'RequestTemporaryCredentials'
	creds, err := s.Client.RequestTemporaryCredentials(http.DefaultClient, s.CallbackURL, params)
	if err != nil {
		return "", "", err
	}
	return creds.Token, creds.Secret, nil
}

func (s *GormUsosService) GetAuthorizationURL(requestToken string) (*url.URL, error) {
	// W tej bibliotece robimy to tak:
	tempCreds := &oauth.Credentials{Token: requestToken}
	// 'AuthorizationURL' zwraca string, a nie *url.URL
	urlString := s.Client.AuthorizationURL(tempCreds, nil)
	return url.Parse(urlString)
}

// GetAccessToken (poprawiona, aby pasowała do 'gomodule')
func (s *GormUsosService) GetAccessToken(requestToken, requestSecret, verifier string) (string, string, error) {
	tempCreds := &oauth.Credentials{
		Token:  requestToken,
		Secret: requestSecret,
	}

	// Używamy metody 'RequestToken'
	creds, _, err := s.Client.RequestToken(http.DefaultClient, tempCreds, verifier)
	if err != nil {
		return "", "", err
	}
	return creds.Token, creds.Secret, nil
}

// GetUserInfo (poprawiona, aby używała 'gomodule')
func (s *GormUsosService) GetUserInfo(accessToken, accessSecret string) (*models.UsosUserInfo, error) {
	tokenCreds := &oauth.Credentials{
		Token:  accessToken,
		Secret: accessSecret,
	}

	fields := "id|first_name|last_name|email"

	// Budujemy URL
	targetURL, _ := url.Parse(fmt.Sprintf("%s/services/users/user", s.UsosAPIURL))
	params := url.Values{}
	params.Set("fields", fields)
	params.Set("scopes", s.Scopes)
	targetURL.RawQuery = params.Encode()

	// Używamy metody 'Get' klienta
	resp, err := s.Client.Get(http.DefaultClient, tokenCreds, targetURL.String(), nil)
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

// MakeSignedRequest (poprawiona, aby używała 'gomodule')
func (s *GormUsosService) MakeSignedRequest(userUsosID, targetPath, queryParams string) (*http.Response, error) {
	log.Printf("Proxy: Pobieranie tokena dla użytkownika %s", userUsosID)
	token, err := s.UserRepo.GetTokenByUsosID(userUsosID)
	if err != nil {
		log.Printf("Proxy: Błąd pobierania tokena: %v", err)
		return nil, fmt.Errorf("błąd pobierania tokena z bazy: %w", err)
	}

	tokenCreds := &oauth.Credentials{
		Token:  token.AccessToken,
		Secret: token.AccessSecret,
	}

	targetURL, err := url.Parse(fmt.Sprintf("%s/services/%s", s.UsosAPIURL, targetPath))
	if err != nil {
		return nil, fmt.Errorf("błąd parsowania URL proxy: %w", err)
	}

	params, _ := url.ParseQuery(queryParams)
	params.Set("scopes", token.Scopes)

	// gomodule/oauth1 chce parametry w metodzie Get, a nie w URL-u
	// więc usuwamy je z RawQuery
	targetURL.RawQuery = ""
	finalURL := targetURL.String()

	log.Printf("Proxy: Wykonywanie podpisanego żądania GET do: %s (z parametrami)", finalURL)

	// Używamy metody 'Get' i przekazujemy 'params' jako ostatni argument
	resp, err := s.Client.Get(http.DefaultClient, tokenCreds, finalURL, params)
	if err != nil {
		log.Printf("Proxy: Błąd żądania GET do USOS: %v", err)
		return nil, fmt.Errorf("błąd żądania do API USOS: %w", err)
	}

	return resp, nil
}
