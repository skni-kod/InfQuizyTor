package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	// Make sure this import is present if needed within this file, otherwise remove
	"github.com/gin-gonic/gin"
	"github.com/mrjones/oauth"
	"github.com/skni-kod/InfQuizyTor/Server/config" // Corrected import path
	"github.com/skni-kod/InfQuizyTor/Server/db"     // Corrected import path
	"github.com/skni-kod/InfQuizyTor/Server/models" // Corrected import path
)

// USOS API URLs
const (
	usosBaseURL     = "https://usosapps.prz.edu.pl"                 // Base URL for the specific USOS instance
	requestTokenURL = usosBaseURL + "/services/oauth/request_token" // Endpoint to get a request token
	authorizeURL    = usosBaseURL + "/services/oauth/authorize"     // Endpoint where user authorizes the app
	accessTokenURL  = usosBaseURL + "/services/oauth/access_token"  // Endpoint to exchange request token for access token
	userInfoURL     = usosBaseURL + "/services/users/user"          // Endpoint to get user details
)

// Global OAuth consumer instance
var consumer *oauth.Consumer

// InitUsosService initializes the OAuth consumer with credentials from config.
func InitUsosService(cfg config.Config) {
	consumer = oauth.NewConsumer(
		cfg.UsosConsumerKey,    // Your application's Consumer Key
		cfg.UsosConsumerSecret, // Your application's Consumer Secret
		oauth.ServiceProvider{
			RequestTokenUrl:   requestTokenURL, // Static URL for requesting tokens
			AuthorizeTokenUrl: authorizeURL,    // Static URL for user authorization page
			AccessTokenUrl:    accessTokenURL,  // Static URL for exchanging tokens
		},
	)
	log.Println("USOS OAuth Consumer Initialized.")
	// Enable debug logging for OAuth signatures if needed during development:
	// consumer.Debug(true)
}

// GetAuthorizationURLAndSecret initiates the OAuth flow Step 1.
// It retrieves a request token and constructs the URL for user redirection.
// Returns: redirectURL, requestTokenKey, requestTokenSecret, error
func GetAuthorizationURLAndSecret(scopes []string) (string, string, string, error) {
	// Construct the callback URL where USOS will redirect the user after authorization
	callbackURL := config.AppConfig.AppBaseURL + "/auth/usos/callback"
	// Format scopes according to USOS API requirements (pipe-separated)
	scopeStr := strings.Join(scopes, "|")

	// Prepare request parameters including scopes if needed directly in request_token URL
	// Note: The mrjones/oauth library might not easily support adding parameters *before* signing.
	// If the API strictly requires scopes at this stage as query params, manual signing might be needed.
	// We assume here that scopes primarily influence the authorization screen or are handled implicitly.
	requestUrlWithParams := requestTokenURL // Start with the base URL
	if scopeStr != "" {
		// Append scopes if provided. Ensure proper URL encoding.
		requestUrlWithParams = fmt.Sprintf("%s?scopes=%s", requestTokenURL, url.QueryEscape(scopeStr))
	}
	// The library uses the URL set during initialization. If dynamic URL needed, manual request is better.
	log.Printf("Requesting token with callback: %s", callbackURL)
	log.Printf("Requesting token with callback: %s", requestUrlWithParams)

	// Use the library to get the request token and the authorization URL fragment
	// Note: The URL returned here might *not* include the base authorizeURL, check library behavior.
	requestToken, _, err := consumer.GetRequestTokenAndUrl(callbackURL) // Pass only the callback here
	if err != nil {
		log.Printf("Error getting USOS request token: %v", err)
		return "", "", "", fmt.Errorf("failed to get request token: %w", err)
	}

	// Log token details (Avoid logging secrets in production!)
	log.Printf("Got Request Token: %s", requestToken.Token)

	// Construct the full URL the user needs to visit for authorization
	finalRedirectURL := fmt.Sprintf("%s?oauth_token=%s", authorizeURL, requestToken.Token)
	log.Printf("Constructed Authorize URL: %s", finalRedirectURL)

	// Return the URL, the token key, and the token secret (needed for the next step)
	return finalRedirectURL, requestToken.Token, requestToken.Secret, nil
}

// ExchangeTokenAndStore performs OAuth flow Step 2.
// Exchanges the authorized request token (with verifier) for an access token and stores it.
// Uses the request token secret retrieved from the user's session.
func ExchangeTokenAndStore(ctx *gin.Context, requestTokenKey, requestTokenSecret, verifier string) (*models.UserToken, error) {
	if requestTokenSecret == "" {
		return nil, fmt.Errorf("request token secret not provided (missing from session?)")
	}

	// Reconstruct the request token object using key and retrieved secret
	requestToken := &oauth.RequestToken{
		Token:  requestTokenKey,
		Secret: requestTokenSecret,
	}

	log.Printf("Exchanging Request Token %s for Access Token...", requestTokenKey)
	// Use the library to exchange the authorized request token for an access token
	accessToken, err := consumer.AuthorizeToken(requestToken, verifier)
	if err != nil {
		log.Printf("Error exchanging token via USOS API: %v", err)
		return nil, fmt.Errorf("failed to authorize token: %w", err)
	}
	log.Printf("Successfully obtained Access Token: %s", accessToken.Token)

	// --- Fetch User Info ---
	// After obtaining the access token, immediately fetch the user's ID to associate the token
	log.Println("Fetching user info using new Access Token...")
	userInfo, err := GetUserInfo(accessToken)
	if err != nil {
		// Critical error if we can't get the user ID associated with the token
		log.Printf("Error fetching user info immediately after token exchange: %v", err)
		// Consider logging the access token here (carefully) for debugging linkage issues
		return nil, fmt.Errorf("obtained access token but failed to retrieve user info: %w", err)
	}
	if userInfo == nil || userInfo.ID == "" {
		log.Printf("User info response missing 'id'. Response: %+v", userInfo)
		return nil, fmt.Errorf("retrieved user info is invalid or missing ID")
	}
	log.Printf("Retrieved User Info: ID=%s, Name=%s %s", userInfo.ID, userInfo.FirstName, userInfo.LastName)

	// --- Store Token in Database ---
	userToken := models.UserToken{
		UserUsosID:        userInfo.ID, // Link token to the fetched User ID
		AccessToken:       accessToken.Token,
		AccessTokenSecret: accessToken.Secret,
		// TODO: Retrieve actual scopes granted by user if possible from API response or store requested scopes
		// Scopes: []string{}, // Placeholder for scopes
	}

	log.Printf("Saving token for user %s to database...", userInfo.ID)
	err = db.SaveUserToken(ctx.Request.Context(), userToken) // Use context from Gin request
	if err != nil {
		log.Printf("Database error saving token for user %s: %v", userInfo.ID, err)
		return nil, fmt.Errorf("failed to save token to database: %w", err)
	}
	log.Printf("Token for user %s saved successfully.", userInfo.ID)

	return &userToken, nil
}

// UsosUserInfo defines the structure for user details fetched from services/users/user.
// Adjust fields based on the actual API response and requested 'fields'.
type UsosUserInfo struct {
	ID        string            `json:"id"`
	FirstName string            `json:"first_name"`
	LastName  string            `json:"last_name"`
	Email     string            `json:"email"` // Requires 'email' scope
	Name      map[string]string `json:"name"`  // Language dictionary for full name
}

// GetUserInfo fetches basic details for the user associated with the given access token.
func GetUserInfo(accessToken *oauth.AccessToken) (*UsosUserInfo, error) {
	// Define the fields to retrieve from the user endpoint
	fields := "id|first_name|last_name|name|email" // Request email only if 'email' scope was granted
	apiURL := fmt.Sprintf("%s?fields=%s", userInfoURL, url.QueryEscape(fields))

	log.Printf("Requesting user info from: %s", apiURL)
	// Create an HTTP client signed with the user's access token
	client, err := consumer.MakeHttpClient(accessToken)
	if err != nil {
		log.Printf("Error creating signed HTTP client for GetUserInfo: %v", err)
		return nil, fmt.Errorf("error creating signed HTTP client: %w", err)
	}

	// Perform the GET request
	resp, err := client.Get(apiURL)
	if err != nil {
		log.Printf("Error during GetUserInfo request to USOS API: %v", err)
		return nil, fmt.Errorf("error making GetUserInfo request: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body for potential error messages
	bodyBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		log.Printf("Error reading GetUserInfo response body: %v", readErr)
		return nil, fmt.Errorf("error reading user info response body: %w", readErr)
	}

	// Check if the request was successful
	if resp.StatusCode != http.StatusOK {
		log.Printf("GetUserInfo request failed. Status: %d, Body: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("GetUserInfo request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Decode the JSON response into the UsosUserInfo struct
	var userInfo UsosUserInfo
	if err := json.Unmarshal(bodyBytes, &userInfo); err != nil { // Use Unmarshal with the read body
		log.Printf("Error decoding user info JSON: %v. Body: %s", err, string(bodyBytes))
		return nil, fmt.Errorf("error decoding user info JSON: %w", err)
	}

	// Add specific check for the ID field
	if userInfo.ID == "" {
		log.Printf("Warning: User Info response parsed successfully but missing 'id' field. Response: %+v", userInfo)
		// Consider if this should be a hard error depending on requirements
	}

	log.Printf("Successfully decoded User Info for ID: %s", userInfo.ID)
	return &userInfo, nil
}

// ProxyUsosApiRequest forwards a request from the frontend to the USOS API after signing it.
// It retrieves the user's token from the database based on their session ID.
func ProxyUsosApiRequest(ctx *gin.Context, userUsosID string, targetPath string, queryParams url.Values) (int, []byte, http.Header, error) {
	// 1. Retrieve the user's stored access token from the database
	log.Printf("Proxy: Retrieving token for user %s", userUsosID)
	userToken, err := db.GetUserToken(ctx.Request.Context(), userUsosID)
	if err != nil {
		log.Printf("Proxy: Database error retrieving token for user %s: %v", userUsosID, err)
		// Internal server error because DB interaction failed
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("database error retrieving token: %w", err)
	}
	if userToken == nil {
		log.Printf("Proxy: No token found in DB for user %s. User needs to re-authenticate.", userUsosID)
		// Unauthorized because the user doesn't have a valid token stored
		return http.StatusUnauthorized, nil, nil, fmt.Errorf("user not authenticated with USOS or token missing")
	}

	// Reconstruct the OAuth Access Token object for signing
	accessToken := &oauth.AccessToken{
		Token:  userToken.AccessToken,
		Secret: userToken.AccessTokenSecret,
	}

	// 2. Construct the full target USOS API URL
	// Ensure targetPath starts correctly (e.g., "services/...")
	if !strings.HasPrefix(targetPath, "services/") {
		log.Printf("Proxy Warning: Requested path '%s' might be missing 'services/' prefix.", targetPath)
		// Assuming path includes 'services/' for now; adjust if necessary
	}
	// Ensure leading slash is removed if present in targetPath to avoid double slash
	cleanTargetPath := strings.TrimPrefix(targetPath, "/")
	apiURL := fmt.Sprintf("%s/%s?%s", usosBaseURL, cleanTargetPath, queryParams.Encode())

	// 3. Create an HTTP client signed with the user's access token
	client, err := consumer.MakeHttpClient(accessToken)
	if err != nil {
		log.Printf("Proxy: Error creating signed HTTP client for user %s: %v", userUsosID, err)
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("error creating signed client: %w", err)
	}

	// 4. Make the proxied request to USOS API (Currently GET only)
	// TODO: Extend this to handle POST/PUT/DELETE by checking ctx.Request.Method
	log.Printf("Proxy: Making GET request for user %s to: %s", userUsosID, apiURL)
	resp, err := client.Get(apiURL)
	if err != nil {
		log.Printf("Proxy: Error contacting USOS API at %s: %v", apiURL, err)
		// Bad Gateway indicates the backend couldn't reach the upstream USOS API
		return http.StatusBadGateway, nil, nil, fmt.Errorf("error contacting USOS API: %w", err)
	}
	defer resp.Body.Close()

	// 5. Read the response body from USOS API
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Proxy: Error reading USOS API response body for %s: %v", apiURL, err)
		return http.StatusInternalServerError, nil, nil, fmt.Errorf("error reading response from USOS API: %w", err)
	}

	log.Printf("Proxy: USOS API response status: %d for %s", resp.StatusCode, cleanTargetPath)
	// Log errors from USOS API for debugging
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("Proxy: USOS API returned error status %d. Body: %s", resp.StatusCode, string(bodyBytes))
	}

	// 6. Return the status code, response body, and relevant headers back to the frontend
	// Filter headers if needed before forwarding
	filteredHeaders := http.Header{}
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		filteredHeaders.Set("Content-Type", contentType)
	}
	// Add other headers to forward if necessary (e.g., Cache-Control)

	return resp.StatusCode, bodyBytes, filteredHeaders, nil
}
