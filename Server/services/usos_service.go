package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mrjones/oauth"

	// Użyj poprawnej ścieżki modułu z go.mod
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
)

var consumer *oauth.Consumer

// InitUsosService inicjalizuje konsumenta OAuth
func InitUsosService(cfg config.Config) {
	consumer = oauth.NewConsumer(
		cfg.UsosConsumerKey,
		cfg.UsosConsumerSecret,
		oauth.ServiceProvider{
			RequestTokenUrl:   cfg.UsosApiBaseURL + "/services/oauth/request_token",
			AuthorizeTokenUrl: cfg.UsosApiBaseURL + "/services/oauth/authorize",
			AccessTokenUrl:    cfg.UsosApiBaseURL + "/services/oauth/access_token",
		},
	)
	log.Println("USOS OAuth Consumer Initialized.")
	// Włącz debugowanie, jeśli potrzebujesz zobaczyć szczegóły podpisów OAuth
	// consumer.Debug(true)
}

// GetAuthorizationURLAndSecret rozpoczyna przepływ OAuth (Krok 1)
func GetAuthorizationURLAndSecret(scopes []string) (string, string, string, error) {
	callbackURL := config.AppConfig.AppBaseURL + "/auth/usos/callback"

	log.Printf("Requesting token with callback: %s", callbackURL)

	// --- POPRAWKA BŁĘDU METODY ---
	// Używamy GetRequestTokenAndUrl. Ta metoda NIE przyjmuje dodatkowych parametrów (jak 'scopes').
	// Zwraca ona requestToken ORAZ gotowy authorizeURL (jako drugi argument).
	requestToken, authorizeURL, err := consumer.GetRequestTokenAndUrl(callbackURL)
	if err != nil {
		log.Printf("Error getting USOS request token (consumer.GetRequestTokenAndUrl): %v", err)
		return "", "", "", fmt.Errorf("failed to get request token: %w", err)
	}
	// --- KONIEC POPRAWKI ---

	log.Printf("Got Request Token: %s", requestToken.Token)
	log.Printf("Authorize URL from library: %s", authorizeURL)

	finalRedirectURL := authorizeURL

	// Ręczne dodanie 'scopes' do URL autoryzacji (zgodnie z wymogiem USOS API)
	if len(scopes) > 0 {
		scopeStr := strings.Join(scopes, "|")
		if strings.Contains(finalRedirectURL, "?") {
			finalRedirectURL = fmt.Sprintf("%s&scopes=%s", finalRedirectURL, url.QueryEscape(scopeStr))
		} else {
			finalRedirectURL = fmt.Sprintf("%s?scopes=%s", finalRedirectURL, url.QueryEscape(scopeStr))
		}
		log.Printf("Appended scopes to Authorize URL: %s", finalRedirectURL)
	}

	return finalRedirectURL, requestToken.Token, requestToken.Secret, nil
}

// --- POPRAWKA BŁĘDU 400 ---
// UsosUserInfo definiuje pola odpowiedzi z /services/users/user
type UsosUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	// USUNIĘTO: Name map[string]string `json:"name"` (To pole powodowało błąd 400)
}

// --- KONIEC POPRAWKI ---

// GetUserInfo pobiera dane użytkownika
func GetUserInfo(accessToken *oauth.AccessToken) (*UsosUserInfo, error) {
	// --- POPRAWKA BŁĘDU 400: Usunięto "name" z fields ---
	fields := "id|first_name|last_name|email"
	apiURL := fmt.Sprintf("%s/services/users/user?fields=%s", config.AppConfig.UsosApiBaseURL, url.QueryEscape(fields))

	log.Printf("Requesting user info from: %s", apiURL)
	client, err := consumer.MakeHttpClient(accessToken)
	if err != nil {
		log.Printf("Error creating signed HTTP client for GetUserInfo: %v", err)
		return nil, fmt.Errorf("error creating signed HTTP client: %w", err)
	}

	resp, err := client.Get(apiURL)
	if err != nil {
		log.Printf("Error during GetUserInfo request to USOS API: %v", err)
		return nil, fmt.Errorf("error making GetUserInfo request: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		log.Printf("Error reading GetUserInfo response body: %v", readErr)
		return nil, fmt.Errorf("error reading user info response body: %w", readErr)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("GetUserInfo request failed. Status: %d, Body: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("GetUserInfo request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var userInfo UsosUserInfo // Użyj poprawionej struktury
	if err := json.Unmarshal(bodyBytes, &userInfo); err != nil {
		log.Printf("Error decoding user info JSON: %v. Body: %s", err, string(bodyBytes))
		return nil, fmt.Errorf("error decoding user info JSON: %w", err)
	}

	if userInfo.ID == "" {
		log.Printf("Warning: User Info response parsed successfully but missing 'id' field. Response: %+v", userInfo)
	}

	log.Printf("Successfully decoded User Info for ID: %s", userInfo.ID)
	return &userInfo, nil
}

// ExchangeTokenAndStore wykonuje Krok 2 OAuth i zapisuje token
func ExchangeTokenAndStore(ctx *gin.Context, requestTokenKey, requestTokenSecret, verifier string, requestedScopes []string) (*models.UserToken, error) {
	if requestTokenSecret == "" {
		return nil, fmt.Errorf("request token secret not provided")
	}
	requestToken := &oauth.RequestToken{Token: requestTokenKey, Secret: requestTokenSecret}

	log.Printf("Exchanging Request Token %s for Access Token...", requestTokenKey)
	accessToken, err := consumer.AuthorizeToken(requestToken, verifier)
	if err != nil {
		log.Printf("Error exchanging token via USOS API: %v", err)
		return nil, fmt.Errorf("failed to authorize token: %w", err)
	}
	log.Printf("Successfully obtained Access Token: %s", accessToken.Token)

	log.Println("Fetching user info using new Access Token...")
	userInfo, err := GetUserInfo(accessToken) // Wywołaj poprawioną funkcję
	if err != nil {
		log.Printf("Error fetching user info after token exchange: %v", err)
		return nil, fmt.Errorf("obtained access token but failed to retrieve user info: %w", err)
	}
	if userInfo == nil || userInfo.ID == "" {
		log.Printf("User info response missing 'id'. Response: %+v", userInfo)
		return nil, fmt.Errorf("retrieved user info is invalid or missing ID")
	}

	// Loguj używając FirstName i LastName
	log.Printf("Retrieved User Info: ID=%s, Name=%s %s", userInfo.ID, userInfo.FirstName, userInfo.LastName)

	userToken := models.UserToken{
		UserUsosID:        userInfo.ID,
		AccessToken:       accessToken.Token,
		AccessTokenSecret: accessToken.Secret,
		Scopes:            requestedScopes,
	}

	log.Printf("Saving token for user %s to database (Scopes: %v)...", userInfo.ID, requestedScopes)
	err = db.SaveUserToken(ctx.Request.Context(), userToken)
	if err != nil {
		log.Printf("Database error saving token for user %s: %v", userInfo.ID, err)
		return nil, fmt.Errorf("failed to save token to database: %w", err)
	}
	log.Printf("Token for user %s saved successfully.", userInfo.ID)

	return &userToken, nil
}

// ProxyUsosApiRequest przekazuje żądanie do USOS API
func ProxyUsosApiRequest(ctx *gin.Context, userUsosID string, targetPath string, queryParams url.Values) (int, []byte, http.Header, error) {
	log.Printf("Proxy: Retrieving token for user %s", userUsosID)
	userToken, err := db.GetUserToken(ctx.Request.Context(), userUsosID)
	if err != nil {
		log.Printf("Proxy: Database error retrieving token for user %s: %v", userUsosID, err)
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("database error retrieving token: %w", err)
	}
	if userToken == nil {
		log.Printf("Proxy: No token found in DB for user %s.", userUsosID)
		return http.StatusUnauthorized, nil, nil, fmt.Errorf("user not authenticated with USOS or token missing")
	}

	accessToken := &oauth.AccessToken{Token: userToken.AccessToken, Secret: userToken.AccessTokenSecret}

	cleanTargetPath := strings.TrimPrefix(targetPath, "/")
	apiURL := fmt.Sprintf("%s/%s?%s", config.AppConfig.UsosApiBaseURL, cleanTargetPath, queryParams.Encode())

	log.Printf("Proxy: Creating signed client for user %s", userUsosID)
	client, err := consumer.MakeHttpClient(accessToken)
	if err != nil {
		log.Printf("Proxy: Error creating signed HTTP client for user %s: %v", userUsosID, err)
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("error creating signed client: %w", err)
	}

	log.Printf("Proxy: Making GET request for user %s to: %s", userUsosID, apiURL)
	resp, err := client.Get(apiURL)
	if err != nil {
		log.Printf("Proxy: Error contacting USOS API at %s: %v", apiURL, err)
		return http.StatusBadGateway, nil, nil, fmt.Errorf("error contacting USOS API: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Proxy: Error reading USOS API response body for %s: %v", apiURL, err)
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("error reading response from USOS API: %w", err)
	}

	log.Printf("Proxy: USOS API response status: %d for %s", resp.StatusCode, cleanTargetPath)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("Proxy: USOS API returned error status %d. Body: %s", resp.StatusCode, string(bodyBytes))
	}

	filteredHeaders := http.Header{}
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		filteredHeaders.Set("Content-Type", contentType)
	}

	return resp.StatusCode, bodyBytes, filteredHeaders, nil
}
