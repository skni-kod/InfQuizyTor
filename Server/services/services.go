package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gomodule/oauth1/oauth" // Używamy 'gomodule'
	"github.com/google/generative-ai-go/genai"
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"google.golang.org/api/option"
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
func (s *GormUsosService) GetFullUserGroups(userUsosID string) (*models.UsosGroupsResponse, error) {
	// Pola, które chcemy pobrać (primary fields wg dokumentacji)
	fields := "course_unit_id|group_number|class_type|class_type_id|course_id|course_name|group_url|term_id|lecturers|participants|relationship_type"

	// Parametry zapytania
	queryParams := fmt.Sprintf("fields=%s&active_terms=false&lang=pl", fields)

	// Wywołanie API
	resp, err := s.MakeSignedRequest(userUsosID, "groups/user", queryParams)
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do groups/user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("błąd API USOS (GetFullUserGroups): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var groupResponse models.UsosGroupsResponse
	if err := json.NewDecoder(resp.Body).Decode(&groupResponse); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON grup: %w", err)
	}

	return &groupResponse, nil
}
func (s *GormUsosService) GetUserGroupsFull(userUsosID string) (*models.UsosGroupsResponse, error) {
	// Definiujemy pola, które chcemy pobrać. Muszą to być pola "Primary" [cite: 42, 92]
	fields := "course_unit_id|group_number|class_type|class_type_id|course_id|course_name|group_url|term_id|lecturers|participants|relationship_type"

	// active_terms=false pozwala pobrać historię, nie tylko bieżący semestr [cite: 93]
	queryParams := fmt.Sprintf("fields=%s&active_terms=false&lang=pl", fields)

	resp, err := s.MakeSignedRequest(userUsosID, "groups/user", queryParams)
	if err != nil {
		return nil, fmt.Errorf("błąd żądania do groups/user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("błąd API USOS (GetUserGroupsFull): status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var groupResponse models.UsosGroupsResponse
	// Dekodujemy złożoną strukturę (mapa grup + lista semestrów)
	if err := json.NewDecoder(resp.Body).Decode(&groupResponse); err != nil {
		return nil, fmt.Errorf("błąd dekodowania JSON grup: %w", err)
	}

	return &groupResponse, nil
}

var GeminiService *GeminiServiceConfig

type GeminiServiceConfig struct {
	APIKey string
}

func InitGeminiService(cfg config.Config) {
	if cfg.GeminiAPIKey == "" {
		log.Println("OSTRZEŻENIE: GEMINI_API_KEY nie jest ustawiony. Funkcje AI nie będą działać.")
	}
	GeminiService = &GeminiServiceConfig{
		APIKey: cfg.GeminiAPIKey,
	}
	log.Println("Serwis Gemini pomyślnie zainicjowany.")
}

// GenerateContent to główna funkcja do komunikacji z AI
func (s *GeminiServiceConfig) GenerateContent(ctx context.Context, prompt string, parts []genai.Part) (string, error) {
	if s.APIKey == "" {
		return "", fmt.Errorf("klucz API Gemini nie jest skonfigurowany")
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(s.APIKey))
	if err != nil {
		return "", fmt.Errorf("błąd tworzenia klienta Gemini: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel("models/gemini-1.5-pro-latest")

	// Wymuszamy odpowiedź JSON
	model.GenerationConfig.ResponseMIMEType = "application/json"

	allParts := append([]genai.Part{genai.Text(prompt)}, parts...)

	resp, err := model.GenerateContent(ctx, allParts...)
	if err != nil {
		return "", fmt.Errorf("błąd generowania treści: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini nie zwrócił żadnej odpowiedzi")
	}

	if txt, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(txt), nil
	}

	return "", fmt.Errorf("gemini zwrócił nieoczekiwany typ odpowiedzi")
}

const (
	// Najbardziej szczegółowy wariant - oryginalne, z selektorami (NAJBARDZIEJ RYZYKOWNY)
	FieldsDetail = "course_unit_id|group_number|class_type|class_type_id|course_id|course_name|group_url|term_id|lecturers[id|first_name|last_name|titles]|participants[id|first_name|last_name|titles]|relationship_type"

	// Uproszczony wariant - pola zagnieżdżone jako primary fields (ŚREDNIO RYZYKOWNY)
	FieldsPrimary = "course_unit_id|group_number|class_type|class_type_id|course_id|course_name|group_url|term_id|lecturers|participants|relationship_type"

	// Wariant bezpieczny - tylko pola dotyczące kursu, bez danych o ludziach (BEZPIECZNY)
	FieldsSafe = "course_unit_id|group_number|class_type|class_type_id|course_id|course_name|group_url|term_id|relationship_type"

	// Wariant minimalistyczny - absolutne minimum (NAJMNIEJ RYZYKOWNY)
	FieldsMinimal = "course_unit_id|course_id|course_name|term_id"
)

// Lista wariantów, którą będziemy iterować.
// Zaczynamy od FieldsSafe lub FieldsPrimary (jeśli chcemy zaryzykować dane prowadzących)
var UsosFieldsFallbacks = []string{
	FieldsSafe,
	FieldsMinimal,
	FieldsPrimary,
	FieldsDetail, // Ostatni, jeśli inne nie zadziałają (mało prawdopodobne, że ten zadziała, gdy poprzednie nie)
}

func (s *GormUsosService) fetchUsosGroups(fields, accessToken, accessSecret string) (models.UsosGroupsResponse, error) {
	params := url.Values{
		"fields":       {fields},
		"active_terms": {"false"},
		"lang":         {"pl"},
		"format":       {"json"},
	}

	token := &oauth.Credentials{
		Token:  accessToken,
		Secret: accessSecret,
	}

	urlStr := fmt.Sprintf("%s/services/groups/user", s.UsosAPIURL)

	// Logowanie żądania do celów diagnostycznych
	log.Printf("USOS API: Próba pobrania grup z fields: %s", fields)

	// Poprawna sygnatura Client.Get
	response, err := s.Client.Get(s.HttpClient, token, urlStr, params)
	if err != nil {
		return models.UsosGroupsResponse{}, fmt.Errorf("błąd wykonania podpisanego żądania USOS: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(response.Body)
		return models.UsosGroupsResponse{}, fmt.Errorf("błąd API USOS (status %d): %s", response.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(response.Body)
	if err != nil {
		return models.UsosGroupsResponse{}, fmt.Errorf("błąd odczytu odpowiedzi USOS: %w", err)
	}

	var usosResponse models.UsosGroupsResponse
	if err := json.Unmarshal(bodyBytes, &usosResponse); err != nil {
		// Błąd dekodowania JSON może wystąpić, jeśli zwracany JSON nie pasuje do modelu UsosGroupsResponse
		// co jest możliwe przy różnych zestawach pól.
		return models.UsosGroupsResponse{}, fmt.Errorf("błąd dekodowania JSON z USOS: %w", err)
	}

	return usosResponse, nil
}
func (s *GormUsosService) GetAllUserGroups(accessToken, accessSecret string) (models.UsosGroupsResponse, error) {
	var lastError error

	// Iteracja przez predefiniowane warianty pól
	for _, fields := range UsosFieldsFallbacks {
		// Wywołaj pomocniczą funkcję z aktualnym zestawem pól
		groupsResponse, err := s.fetchUsosGroups(fields, accessToken, accessSecret)

		if err == nil {
			// SUKCES: Jeśli błąd wynosi nil, zwracamy dane
			log.Printf("USOS API: Sukces pobrania grup przy użyciu fields: %s", fields)
			return groupsResponse, nil
		}

		// Zapisz ostatni błąd (dla celów diagnostycznych)
		lastError = err

		// Jeśli to błąd USOS 500, próbujemy dalej.
		// Jeśli to błąd wykonania żądania (np. problem z połączeniem), możemy się zatrzymać,
		// ale kontynuowanie pętli jest bezpieczniejsze.
		log.Printf("USOS API: Próba nieudana dla fields: %s. Błąd: %v", fields, err)

		// Dodanie krótkiej przerwy, aby nie zalewać serwera USOS żądaniami
		time.Sleep(100 * time.Millisecond)
	}

	// Jeśli żadne żądanie nie zadziałało, zwracamy ostatni napotkany błąd.
	log.Println("USOS API: Wszystkie warianty fields zawiodły.")
	return models.UsosGroupsResponse{}, fmt.Errorf("nie udało się pobrać grup USOS po próbie wszystkich wariantów fields. Ostatni błąd: %w", lastError)
}
