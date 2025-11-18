package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gomodule/oauth1/oauth" // Używamy 'gomodule'
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
)

var UsosService *GormUsosService

type GormUsosService struct {
	Client      *oauth.Client
	UsosAPIURL  string
	UserRepo    *db.GormUserRepository
	Scopes      string
	FrontendURL string
	CallbackURL string
	HttpClient  *http.Client
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

// GetRequestToken (poprawny dla 'gomodule' - wysyła scopes)
func (s *GormUsosService) GetRequestToken() (string, string, error) {
	additionalParams := url.Values{}
	additionalParams.Set("scopes", s.Scopes)

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

// GetUserInfo (poprawny dla 'gomodule')
func (s *GormUsosService) GetUserInfo(accessToken, accessSecret string) (*models.UsosUserInfo, error) {
	accessCreds := &oauth.Credentials{
		Token:  accessToken,
		Secret: accessSecret,
	}
	fields := "id|first_name|last_name|email"
	baseURL := fmt.Sprintf("%s/services/users/user", s.UsosAPIURL)
	params := url.Values{}
	params.Set("fields", fields)

	resp, err := s.Client.Get(
		s.HttpClient,
		accessCreds,
		baseURL,
		params,
	)
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

// MakeSignedRequest (poprawny dla 'gomodule')
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

	// Dodajemy scopes (wymagane przez niektóre endpointy USOS)
	params.Set("scopes", token.Scopes)

	log.Printf("Proxy: Wykonywanie podpisanego żądania GET do: %s z parametrami: %s", baseURL, params.Encode())

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

// --- POPRAWKA: Usunięto 'services/' z wywołania MakeSignedRequest ---
// --- Oraz dodano logikę fallback dla błędu 400 (Unrecognized character) ---

func (s *GormUsosService) GetCourses(userUsosID string) (*models.UsosUserCoursesResponse, error) {
	fields := "course_editions(course_id|course_name)"
	// Wywołujemy "courses/user", a nie "services/courses/user"
	resp, err := s.MakeSignedRequest(userUsosID, "courses/user", fmt.Sprintf("fields=%s", fields))
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do courses/user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		// Sprawdzamy, czy błąd to 400 (Bad Request) i czy zawiera błąd pól
		if resp.StatusCode == http.StatusBadRequest && (strings.Contains(string(bodyBytes), "Unrecognized character") || strings.Contains(string(bodyBytes), "invalid_fields")) {
			log.Println("OSTRZEŻENIE: Serwer USOS nie wspiera pól zagnieżdżonych. Ponawiam próbę z uproszczonymi polami.")
			return s.GetCoursesFallback(userUsosID)
		}
		log.Printf("Błąd odpowiedzi USOS (GetCourses): Status %d, Body: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("błąd API USOS (GetCourses): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var courseData models.UsosUserCoursesResponse
	if err := json.NewDecoder(resp.Body).Decode(&courseData); err != nil {
		log.Printf("Błąd dekodowania JSON, próba fallback: %v", err)
		return s.GetCoursesFallback(userUsosID)
	}

	if courseData.CourseEditions == nil {
		log.Println("OSTRZEŻENIE: Odpowiedź API nie zawierała 'course_editions'. Ponawiam próbę z fallbackiem.")
		return s.GetCoursesFallback(userUsosID)
	}

	return &courseData, nil
}

func (s *GormUsosService) GetCoursesFallback(userUsosID string) (*models.UsosUserCoursesResponse, error) {
	// Wywołujemy "courses/user" z prostymi polami
	resp, err := s.MakeSignedRequest(userUsosID, "courses/user", "fields=course_editions")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("błąd API USOS (GetCoursesFallback): status %d", resp.StatusCode)
	}
	var courseData models.UsosUserCoursesResponse
	if err := json.NewDecoder(resp.Body).Decode(&courseData); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON z courses/user (fallback): %w", err)
	}
	return &courseData, nil
}

func (s *GormUsosService) GetUserGroups(userUsosID string) ([]models.UsosUserGroup, error) {
	// Wywołujemy "groups/user"
	resp, err := s.MakeSignedRequest(userUsosID, "groups/user", "fields=course_unit_id|group_number|course_name|class_type")
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do groups/user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("błąd API USOS (GetUserGroups): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var userGroups []models.UsosUserGroup
	if err := json.NewDecoder(resp.Body).Decode(&userGroups); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON z groups/user: %w", err)
	}
	return userGroups, nil
}
