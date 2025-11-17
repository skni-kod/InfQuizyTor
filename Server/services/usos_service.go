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

	"github.com/gomodule/oauth1/oauth"
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

// GetRequestToken (bez zmian)
func (s *GormUsosService) GetRequestToken() (string, string, error) {
	additionalParams := url.Values{}
	additionalParams.Set("scopes", s.Scopes)
	creds, err := s.Client.RequestTemporaryCredentials(s.HttpClient, s.CallbackURL, additionalParams)
	if err != nil {
		return "", "", fmt.Errorf("błąd pobierania Request Tokena: %w", err)
	}
	return creds.Token, creds.Secret, nil
}

// GetAuthorizationURL (bez zmian)
func (s *GormUsosService) GetAuthorizationURL(requestToken string) (*url.URL, error) {
	tempCreds := &oauth.Credentials{Token: requestToken}
	urlString := s.Client.AuthorizationURL(tempCreds, nil)
	return url.Parse(urlString)
}

// GetAccessToken (bez zmian)
func (s *GormUsosService) GetAccessToken(requestToken, requestSecret, verifier string) (string, string, error) {
	tempCreds := &oauth.Credentials{Token: requestToken, Secret: requestSecret}
	creds, _, err := s.Client.RequestToken(s.HttpClient, tempCreds, verifier)
	if err != nil {
		return "", "", fmt.Errorf("błąd wymiany Access Tokena: %w", err)
	}
	return creds.Token, creds.Secret, nil
}

// GetUserInfo (bez zmian)
func (s *GormUsosService) GetUserInfo(accessToken, accessSecret string) (*models.UsosUserInfo, error) {
	accessCreds := &oauth.Credentials{Token: accessToken, Secret: accessSecret}
	baseURL := fmt.Sprintf("%s/services/users/user", s.UsosAPIURL)
	params := url.Values{}
	params.Set("fields", "id|first_name|last_name|email")

	resp, err := s.Client.Get(s.HttpClient, accessCreds, baseURL, params)
	if err != nil {
		return nil, fmt.Errorf("błąd pobierania danych użytkownika: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("błąd API USOS (GetUserInfo): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var userInfo models.UsosUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON użytkownika: %w", err)
	}
	return &userInfo, nil
}

// MakeSignedRequest (bez zmian)
func (s *GormUsosService) MakeSignedRequest(userUsosID, targetPath, queryParams string) (*http.Response, error) {
	token, err := s.UserRepo.GetTokenByUsosID(userUsosID)
	if err != nil {
		return nil, fmt.Errorf("błąd pobierania tokena z bazy: %w", err)
	}
	accessCreds := &oauth.Credentials{Token: token.AccessToken, Secret: token.AccessSecret}
	baseURL := fmt.Sprintf("%s/services/%s", s.UsosAPIURL, targetPath)
	params, _ := url.ParseQuery(queryParams)

	resp, err := s.Client.Get(s.HttpClient, accessCreds, baseURL, params)
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do API USOS: %w", err)
	}
	return resp, nil
}

// --- NOWE FUNKCJE ---

// GetCourses pobiera listę przedmiotów użytkownika z USOS
func (s *GormUsosService) GetCourses(userUsosID string) (*models.UsosUserCoursesResponse, error) {
	fields := "course_editions(course_id|course_name)"
	resp, err := s.MakeSignedRequest(userUsosID, "services/courses/user", fmt.Sprintf("fields=%s", fields))
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do courses/user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		// Specjalna obsługa błędu pól z nawiasami
		if strings.Contains(string(bodyBytes), "Unrecognized character") {
			log.Println("OSTRZEŻENIE: Serwer USOS nie wspiera pól zagnieżdżonych. Ponawiam próbę z uproszczonymi polami.")
			return s.GetCoursesFallback(userUsosID)
		}
		return nil, fmt.Errorf("błąd API USOS (GetCourses): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var courseData models.UsosUserCoursesResponse
	if err := json.NewDecoder(resp.Body).Decode(&courseData); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON z courses/user: %w", err)
	}
	return &courseData, nil
}

// GetCoursesFallback to wersja zapasowa, jeśli pola z nawiasami zawiodą
func (s *GormUsosService) GetCoursesFallback(userUsosID string) (*models.UsosUserCoursesResponse, error) {
	resp, err := s.MakeSignedRequest(userUsosID, "services/courses/user", "fields=course_editions")
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

// GetUserGroups pobiera listę grup zajęciowych użytkownika
func (s *GormUsosService) GetUserGroups(userUsosID string) ([]models.UsosUserGroup, error) {
	resp, err := s.MakeSignedRequest(userUsosID, "services/groups/user", "fields=course_unit_id|group_number|course_name|class_type")
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
