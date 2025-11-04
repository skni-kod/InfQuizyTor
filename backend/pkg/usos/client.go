package services

import (
	"crypto/hmac"     // <-- DODAJ
	"crypto/sha1"     // <-- DODAJ
	"encoding/base64" // <-- DODAJ
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil" // <-- DODAJ
	"log"
	"net/http"
	"net/url"
	"sort"    // <-- DODAJ
	"strconv" // <-- DODAJ
	"strings"
	"time" // <-- DODAJ

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
}

// GetAuthorizationURLAndSecret rozpoczyna przepływ OAuth (Krok 1)
// Ta funkcja zastępuje wadliwą logikę z biblioteki mrjones/oauth
func GetAuthorizationURLAndSecret(scopes []string) (string, string, string, error) {
	callbackURL := config.AppConfig.AppBaseURL + "/auth/usos/callback"
	log.Printf("MANUAL GetRequestToken: callback: %s, scopes: %v", callbackURL, scopes)

	// 1. Zbuduj parametry dla sygnatury i zapytania
	params := make(map[string]string)
	params["oauth_consumer_key"] = config.AppConfig.UsosConsumerKey
	params["oauth_nonce"] = fmt.Sprintf("%d", time.Now().UnixNano())
	params["oauth_signature_method"] = "HMAC-SHA1"
	params["oauth_timestamp"] = strconv.FormatInt(time.Now().Unix(), 10)
	params["oauth_version"] = "1.0"
	params["oauth_callback"] = callbackURL

	// Kluczowy krok: Dodaj 'scopes' do parametrów, aby zostały podpisane
	if len(scopes) > 0 {
		params["scopes"] = strings.Join(scopes, "|")
	}

	// 2. Zbuduj bazę dla sygnatury (posortowane parametry)
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	paramStr := ""
	for i, k := range keys {
		// Ważne: parametry muszą być zakodowane
		paramStr += fmt.Sprintf("%s=%s", url.QueryEscape(k), url.QueryEscape(params[k]))
		if i < len(keys)-1 {
			paramStr += "&"
		}
	}

	httpMethod := "GET"
	baseRequestUrl := config.AppConfig.UsosApiBaseURL + "/services/oauth/request_token"
	baseString := fmt.Sprintf("%s&%s&%s",
		httpMethod,
		url.QueryEscape(baseRequestUrl),
		url.QueryEscape(paramStr),
	)

	// 3. Wygeneruj sygnaturę
	// Klucz do podpisu to "ConsumerSecret&TokenSecret" (TokenSecret jest pusty na tym etapie)
	signingKey := url.QueryEscape(config.AppConfig.UsosConsumerSecret) + "&"
	mac := hmac.New(sha1.New, []byte(signingKey))
	mac.Write([]byte(baseString))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	// 4. Zbuduj *faktyczny* adres URL zapytania (z parametrami w query string)
	reqUrl, _ := url.Parse(baseRequestUrl)
	query := reqUrl.Query()
	// Dodajemy parametry, których USOS oczekuje w query string
	if len(scopes) > 0 {
		query.Set("scopes", strings.Join(scopes, "|"))
	}
	query.Set("oauth_callback", callbackURL)
	reqUrl.RawQuery = query.Encode()

	// 5. Zbuduj nagłówek "Authorization" (z parametrami OAuth)
	// Ważne: 'scopes' nie idzie do nagłówka, ale 'oauth_callback' tak.
	authHeader := fmt.Sprintf(
		"OAuth oauth_consumer_key=\"%s\", oauth_nonce=\"%s\", oauth_signature=\"%s\", oauth_signature_method=\"%s\", oauth_timestamp=\"%s\", oauth_version=\"%s\", oauth_callback=\"%s\"",
		url.QueryEscape(params["oauth_consumer_key"]),
		url.QueryEscape(params["oauth_nonce"]),
		url.QueryEscape(signature),
		url.QueryEscape(params["oauth_signature_method"]),
		url.QueryEscape(params["oauth_timestamp"]),
		url.QueryEscape(params["oauth_version"]),
		url.QueryEscape(params["oauth_callback"]),
	)

	// 6. Wykonaj zapytanie HTTP
	client := &http.Client{}
	req, err := http.NewRequest(httpMethod, reqUrl.String(), nil)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", authHeader)

	log.Printf("Making manual GET request to %s", reqUrl.String())
	resp, err := client.Do(req)
	if err != nil {
		return "", "", "", fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		// Zwróć błąd z USOS, jeśli wystąpił
		return "", "", "", fmt.Errorf("failed to get request token, status %d: %s", resp.StatusCode, string(body))
	}

	// 7. Sparsuj odpowiedź (np. "oauth_token=...&oauth_token_secret=...")
	responseParams, err := url.ParseQuery(string(body))
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse response body '%s': %w", string(body), err)
	}

	requestToken := responseParams.Get("oauth_token")
	requestSecret := responseParams.Get("oauth_token_secret")

	if requestToken == "" || requestSecret == "" {
		return "", "", "", fmt.Errorf("response missing oauth_token or oauth_token_secret")
	}

	// 8. Zbuduj URL autoryzacji, na który przekierujemy użytkownika
	authorizeURL := fmt.Sprintf("%s/services/oauth/authorize?oauth_token=%s",
		config.AppConfig.UsosApiBaseURL,
		url.QueryEscape(requestToken),
	)

	log.Printf("Got Request Token: %s", requestToken)
	log.Printf("Authorize URL: %s", authorizeURL)

	return authorizeURL, requestToken, requestSecret, nil
}

// --- POPRAWKA BŁĘDU 400 ---
// UsosUserInfo definiuje pola odpowiedzi z /services/users/user
type UsosUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

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
	// Ta funkcja z biblioteki jest OK, ponieważ nie wymaga niestandardowych parametrów
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
// Ta funkcja jest OK, ponieważ MakeHttpClient działa poprawnie, gdy ma już token
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
