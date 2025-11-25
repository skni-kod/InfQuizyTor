package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"io"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"github.com/skni-kod/InfQuizyTor/Server/db" // Importuj pakiet db
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

func HandleGetPendingFlashcards(c *gin.Context) {
	flashcards, err := db.UserRepository.GetPendingFlashcards()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania oczekujących fiszek: "+err.Error())
		return
	}
	utils.SendSuccess(c, http.StatusOK, flashcards)
}

// HandleApproveFlashcard (Pełna implementacja)
func HandleApproveFlashcard(c *gin.Context) {
	flashcardIDParam := c.Param("id")
	flashcardID, err := strconv.ParseUint(flashcardIDParam, 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe ID fiszki")
		return
	}

	if err := db.UserRepository.SetFlashcardStatus(uint(flashcardID), "approved"); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd zatwierdzania fiszki: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, gin.H{"message": fmt.Sprintf("Fiszka %d zatwierdzona", flashcardID)})
}

// HandleRejectFlashcard (Pełna implementacja)
func HandleRejectFlashcard(c *gin.Context) {
	flashcardIDParam := c.Param("id")
	flashcardID, err := strconv.ParseUint(flashcardIDParam, 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe ID fiszki")
		return
	}

	if err := db.UserRepository.SetFlashcardStatus(uint(flashcardID), "rejected"); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd odrzucania fiszki: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, gin.H{"message": fmt.Sprintf("Fiszka %d odrzucona", flashcardID)})
}
func HandleUsosLogin(c *gin.Context) {
	session := sessions.Default(c)

	// 1. Pobierz Request Token z USOS API
	requestToken, requestSecret, err := services.UsosService.GetRequestToken()
	if err != nil {
		log.Printf("Błąd GetRequestToken: %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Nie można połączyć się z USOS")
		return
	}

	// 2. Zapisz sekret w sesji (potrzebny do wymiany na Access Token)
	session.Set("request_secret", requestSecret)
	if err := session.Save(); err != nil {
		log.Printf("Błąd zapisu sesji (request_secret): %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Błąd wewnętrzny serwera")
		return
	}

	// 3. Wygeneruj URL do autoryzacji dla użytkownika
	authURL, err := services.UsosService.GetAuthorizationURL(requestToken)
	if err != nil {
		log.Printf("Błąd GetAuthorizationURL: %v", err)
		utils.SendError(c, http.StatusInternalServerError, "Błąd generowania URL autoryzacji")
		return
	}

	// Zwróć URL do frontend-u, aby przekierował użytkownika
	c.JSON(http.StatusOK, gin.H{"authorization_url": authURL.String()})
}

// HandleUsosCallback obsługuje powrót użytkownika z USOS
func HandleUsosCallback(c *gin.Context) {
	session := sessions.Default(c)

	// Pobierz parametry z URL
	requestToken := c.Query("oauth_token")
	verifier := c.Query("oauth_verifier")
	frontendURL := services.UsosService.FrontendURL // Upewnij się, że to jest zdefiniowane w serwisie

	// 1. Odzyskaj sekret z sesji
	requestSecretValue := session.Get("request_secret")
	if requestSecretValue == nil {
		log.Println("Błąd: brak request_secret w sesji (sesja wygasła lub błędne żądanie)")
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=session_expired", frontendURL))
		return
	}
	requestSecret := requestSecretValue.(string)

	// 2. Wymień Request Token na Access Token
	accessToken, accessSecret, err := services.UsosService.GetAccessToken(requestToken, requestSecret, verifier)
	if err != nil {
		log.Printf("Błąd wymiany Access Tokena: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=auth_failed", frontendURL))
		return
	}

	// 3. Pobierz dane użytkownika używając nowego Access Tokena
	userInfo, err := services.UsosService.GetUserInfo(accessToken, accessSecret)
	if err != nil {
		log.Printf("Błąd pobierania danych użytkownika: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=user_info_failed", frontendURL))
		return
	}

	// 4. Zapisz/Zaktualizuj użytkownika w bazie (UPSERT)
	user := &models.User{
		UsosID:    userInfo.ID,
		FirstName: userInfo.FirstName,
		LastName:  userInfo.LastName,
		Email:     userInfo.Email,
	}
	if err := db.UserRepository.CreateOrUpdateUser(user); err != nil {
		log.Printf("Błąd zapisu użytkownika do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_error", frontendURL))
		return
	}

	// 5. Zapisz/Zaktualizuj TOKEN w bazie (To jest kluczowe dla odświeżania tokena!)
	token := &models.Token{
		UserUsosID:   userInfo.ID,
		AccessToken:  accessToken,
		AccessSecret: accessSecret,
		Scopes:       services.UsosService.Scopes, // Pobierz scopes z serwisu
	}

	// Tutaj wywołujemy funkcję, która musi obsługiwać nadpisywanie starego tokena
	if err := db.UserRepository.SaveToken(token); err != nil {
		log.Printf("Błąd zapisu tokena do DB: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=db_error", frontendURL))
		return
	}

	// 6. Ustaw sesję użytkownika (zaloguj go w naszej aplikacji)
	session.Set("user_usos_id", userInfo.ID)
	session.Delete("request_secret") // Wyczyść tymczasowy sekret
	if err := session.Save(); err != nil {
		log.Printf("Błąd zapisu sesji końcowej: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/?error=session_save_failed", frontendURL))
		return
	}

	log.Printf("Użytkownik %s (%s %s) pomyślnie zalogowany i token odświeżony.", userInfo.ID, userInfo.FirstName, userInfo.LastName)

	// Przekieruj na dashboard frontendu
	c.Redirect(http.StatusFound, frontendURL)
}

// HandleLogout wylogowuje użytkownika
func HandleLogout(c *gin.Context) {
	session := sessions.Default(c)
	userUsosID := session.Get("user_usos_id")

	if userUsosID != nil {
		log.Printf("Wylogowywanie użytkownika: %v", userUsosID)
	}

	session.Clear()                               // Czyści wszystkie klucze
	session.Options(sessions.Options{MaxAge: -1}) // Usuwa ciasteczko
	session.Save()

	utils.SendSuccess(c, http.StatusOK, gin.H{"message": "Wylogowano pomyślnie"})
}

var systemLayers = map[string]models.CalendarLayer{
	"usos-class": {ID: 999991, Name: "Zajęcia Dydaktyczne USOS", Color: "#3498DB", Type: "system", OwnerUsosID: ""},
	"usos-exam":  {ID: 999992, Name: "Egzaminy/Kolokwia USOS", Color: "#E74C3C", Type: "system", OwnerUsosID: ""},
}

// HandleGetAllCalendarEvents implementuje pełną logikę pobierania wydarzeń.
func HandleGetAllCalendarEvents(c *gin.Context) {
	userUsosID := c.MustGet("user_usos_id").(string)

	// Domyślne parametry z frontendu
	startStr := c.DefaultQuery("start", time.Now().Format("2006-01-02"))
	daysStr := c.DefaultQuery("days", "7")
	days, _ := strconv.Atoi(daysStr)

	// Walidacja dni dla bazy danych (lokalnie możemy pobrać więcej)
	dbDays := days
	if dbDays < 1 {
		dbDays = 7
	}
	if dbDays > 90 {
		dbDays = 90
	}

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		start = time.Now()
	}
	end := start.AddDate(0, 0, dbDays)

	// 1. POBIERANIE DANYCH Z USOS
	// --- NAPRAWA BŁĘDU 400 ---
	// USOS API 'tt/user' często ma limit 7 dni.
	// Wymuszamy max 7 dni dla zapytania do USOS, niezależnie od tego, o ile prosi frontend.
	usosDays := 7

	// Pola, o które pytamy USOS (bez classtype_name, bo bywa problematyczne)
	usosFields := "start_time|end_time|name|type|url|building_name|room_number|course_name"
	queryParams := fmt.Sprintf("start=%s&days=%d&fields=%s", start.Format("2006-01-02"), usosDays, usosFields)

	var usosActivities []models.UsosActivity

	log.Printf("Calendar: Pobieranie danych z USOS dla user=%s, start=%s, days=%d", userUsosID, start.Format("2006-01-02"), usosDays)

	resp, err := services.UsosService.MakeSignedRequest(userUsosID, "tt/user", queryParams)
	if err != nil {
		log.Printf("Calendar: Błąd sieciowy USOS: %v", err)
	} else {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			log.Printf("Calendar: Błąd API USOS (Status %d): %s", resp.StatusCode, string(bodyBytes))
			// Nie zwracamy błędu do klienta, żeby chociaż dane z DB się wyświetliły
		} else {
			if err := json.Unmarshal(bodyBytes, &usosActivities); err != nil {
				log.Printf("Calendar: Błąd parsowania JSON USOS: %v", err)
			} else {
				log.Printf("Calendar: Sukces! Pobrano %d wydarzeń z USOS", len(usosActivities))
			}
		}
	}

	// 2. POBIERANIE DANYCH Z BAZY (Warstwy i Eventy)
	var dbEvents []models.CalendarEvent = []models.CalendarEvent{}

	dbLayers, _ := db.UserRepository.GetLayersByUsosID(userUsosID)

	if len(dbLayers) > 0 {
		var layerIDs []uint
		for _, l := range dbLayers {
			layerIDs = append(layerIDs, l.ID)
		}
		evts, err := db.UserRepository.GetEventsByLayerIDs(layerIDs, start, end)
		if err == nil {
			dbEvents = evts
		}
	}

	// 3. SCALANIE I MAPOWANIE
	events := []models.AppCalendarEvent{}

	// A. Wydarzenia USOS
	for _, act := range usosActivities {
		layerID := "usos-class"
		eventType := "class"

		nameLower := strings.ToLower(act.Name.PL)
		typeLower := strings.ToLower(act.Type)

		// Prosta detekcja typu (bo classtype_name może nie być dostępne)
		if strings.Contains(nameLower, "wykład") || strings.Contains(typeLower, "lecture") {
			eventType = "lecture"
		} else if strings.Contains(nameLower, "laboratorium") || strings.Contains(nameLower, "projekt") || strings.Contains(typeLower, "lab") {
			eventType = "lab"
		} else if typeLower == "exam" || strings.Contains(nameLower, "kolokwium") || strings.Contains(nameLower, "egzamin") {
			layerID = "usos-exam"
			eventType = "colloquium"
		}

		events = append(events, models.AppCalendarEvent{
			ID:          act.StartTime + act.CourseID,
			LayerID:     layerID,
			Type:        eventType,
			StartTime:   act.StartTime,
			EndTime:     act.EndTime,
			Title:       act.Name.PL,
			Description: act.CourseName.PL,
			RoomNumber:  act.RoomNumber,
			CourseName:  act.CourseName,
			// ClasstypeName: act.ClasstypeName,
		})
	}

	// B. Wydarzenia z DB
	for _, evt := range dbEvents {
		layerKey := fmt.Sprintf("db-%d", evt.LayerID)
		eventType := "private"

		if strings.Contains(strings.ToLower(evt.Title), "trening") {
			eventType = "sport"
		}

		events = append(events, models.AppCalendarEvent{
			ID:          fmt.Sprintf("db-%d", evt.ID),
			LayerID:     layerKey,
			Type:        eventType,
			StartTime:   evt.StartTime.Format("2006-01-02 15:04:05"),
			EndTime:     evt.EndTime.Format("2006-01-02 15:04:05"),
			Title:       evt.Title,
			Description: evt.Description,
		})
	}

	// 4. DEFINICJE WARSTW
	layerDefinitions := make(map[string]models.CalendarLayerDefinition)
	for key, layer := range systemLayers {
		layerDefinitions[key] = models.CalendarLayerDefinition{
			ID: key, Name: layer.Name, Color: layer.Color, IsSystem: true,
		}
	}
	for _, layer := range dbLayers {
		key := fmt.Sprintf("db-%d", layer.ID)
		layerDefinitions[key] = models.CalendarLayerDefinition{
			ID: key, Name: layer.Name, Color: layer.Color, IsSystem: false,
		}
	}

	utils.SendSuccess(c, http.StatusOK, models.AppCalendarResponse{
		Events: events,
		Layers: layerDefinitions,
	})
}

// HandleGetUserUsosGroups
func HandleGetUserUsosGroups(c *gin.Context) {
	userUsosID := c.MustGet("user_usos_id").(string)
	groups, err := services.UsosService.GetUserGroups(userUsosID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SendSuccess(c, http.StatusOK, groups)
}

type CreateLayerRequest struct {
	Name        string `json:"name" binding:"required"`
	Color       string `json:"color" binding:"required"`
	Type        string `json:"type" binding:"required"`
	UsosGroupID int    `json:"usos_group_id"`
}

// HandleCreateCalendarLayer
func HandleCreateCalendarLayer(c *gin.Context) {
	userUsosID := c.MustGet("user_usos_id").(string)
	var req CreateLayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe dane: "+err.Error())
		return
	}

	layer := &models.CalendarLayer{
		Name:        req.Name,
		Color:       req.Color,
		Type:        req.Type,
		OwnerUsosID: userUsosID,
		UsosGroupID: req.UsosGroupID,
	}

	if err := db.UserRepository.CreateCalendarLayer(layer); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd zapisu warstwy")
		return
	}
	utils.SendSuccess(c, http.StatusCreated, layer)
}
func HandleGetTopicContent(c *gin.Context) {
	topicIDParam := c.Param("id")
	topicID, err := strconv.ParseUint(topicIDParam, 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe ID tematu")
		return
	}

	// Pobierz zatwierdzone fiszki
	flashcards, err := db.UserRepository.GetApprovedFlashcardsByTopic(uint(topicID))
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania fiszek: "+err.Error())
		return
	}

	// Pobierz zatwierdzone pytania quizowe
	questions, err := db.UserRepository.GetApprovedQuizQuestionsByTopic(uint(topicID))
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania pytań quizu: "+err.Error())
		return
	}

	// TODO: Pobierz podsumowanie (SourceNote)

	utils.SendSuccess(c, http.StatusOK, gin.H{
		"flashcards":     flashcards,
		"quiz_questions": questions,
		"summary":        "To jest podsumowanie z bazy danych (TODO)",
	})
}
func HandleGetSubjects(c *gin.Context) {
	subjects, err := db.UserRepository.GetSubjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania przedmiotów"})
		return
	}
	if subjects == nil {
		subjects = []models.Subject{}
	}
	c.JSON(http.StatusOK, subjects)
}

// HandleSyncSubjects - Pobiera dane z USOS i zapisuje je w naszej bazie danych
func HandleSyncSubjects(c *gin.Context) {
	// 1. Pobierz userUsosID z sesji
	session := sessions.Default(c)
	userUsosIDValue := session.Get("user_usos_id")
	if userUsosIDValue == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Brak autoryzacji"})
		return
	}
	userUsosID := userUsosIDValue.(string)

	// 2. Wywołaj USOS API używając MakeSignedRequest
	usosPath := "courses/user"
	usosFields := "course_editions|terms"

	resp, err := services.UsosService.MakeSignedRequest(userUsosID, usosPath, usosFields)
	if err != nil {
		log.Printf("HandleSyncSubjects: Błąd z MakeSignedRequest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania kursów z USOS: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	// 3. Odczytaj i zdekoduj JSON
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd odczytu odpowiedzi USOS: " + err.Error()})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "Błąd serwera USOS", "details": string(bodyBytes)})
		return
	}

	var usosCourses models.UsosUserCoursesResponse
	if err := json.Unmarshal(bodyBytes, &usosCourses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd dekodowania odpowiedzi USOS: " + err.Error()})
		return
	}

	// 4. Synchronizuj kursy z naszą bazą danych (FindOrCreate)
	for _, termCourses := range usosCourses.CourseEditions {
		for _, course := range termCourses {
			// Użyj funkcji z db.go, aby znaleźć lub utworzyć wpis
			_, err := db.UserRepository.FindOrCreateSubjectByUsosID(course.CourseID, course.CourseName.PL)
			if err != nil {
				log.Printf("Błąd synchronizacji przedmiotu %s (ID: %s): %v", course.CourseName.PL, course.CourseID, err)
			}
		}
	}

	// 5. Zwróć sukces
	c.JSON(http.StatusOK, gin.H{"status": "synchronized"})
}

// HandleGetTopicsByUsosID pobiera odblokowane tematy (Topics) dla danego kursu
func HandleGetTopicsByUsosID(c *gin.Context) {
	usosID := c.Param("usos_id")

	// 1. Znajdź nasz wewnętrzny Subject.ID na podstawie usosID
	subject, err := db.UserRepository.GetSubjectByUsosID(usosID)
	if err != nil {
		log.Printf("Błąd HandleGetTopicsByUsosID: Nie znaleziono przedmiotu dla usosID: %s. Błąd: %v", usosID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Nie znaleziono przedmiotu w bazie danych. Spróbuj odświeżyć stronę."})
		return
	}

	// 2. Użyj Subject.ID (uint) do pobrania tematów
	topics, err := db.UserRepository.GetTopicsBySubjectID(subject.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania tematów"})
		return
	}

	if topics == nil {
		topics = []models.Topic{} // Zwróć pustą tablicę zamiast null
	}

	c.JSON(http.StatusOK, topics)
}

// HandleGetCourseGraph pobiera strukturę grafu (QuizNodes) dla danego kursu
func HandleGetCourseGraph(c *gin.Context) {
	usosID := c.Param("usos_id")

	// 1. Pobierz węzły (QuizNode) z bazy dla danego UsosCourseID
	nodes, err := db.UserRepository.GetGraphByCourseUsosID(usosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania grafu"})
		return
	}

	if nodes == nil {
		nodes = []models.QuizNode{} // Zwróć pustą tablicę zamiast null
	}

	c.JSON(http.StatusOK, nodes)
}
func HandleGetUpcomingEvents(c *gin.Context) {
	session := sessions.Default(c)
	userUsosID := session.Get("user_usos_id").(string)

	// Zapytanie do USOS: Plan na 3 dni
	days := "3"
	resp, err := services.UsosService.MakeSignedRequest(userUsosID, "tt/user", fmt.Sprintf("days=%s", days))
	if err != nil {
		// Jeśli błąd sieci/tokena, zwróć pustą listę (żeby nie wysypać dashboardu)
		log.Printf("Błąd połączenia z USOS tt/user: %v", err)
		c.JSON(http.StatusOK, []models.DashboardUpcomingEvent{})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Loguj błąd, ale zwróć pustą listę do frontendu
		log.Printf("USOS tt/user returned status: %d", resp.StatusCode)
		c.JSON(http.StatusOK, []models.DashboardUpcomingEvent{})
		return
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var activities []models.UsosActivity

	// USOS tt/user zwraca tablicę obiektów
	if err := json.Unmarshal(bodyBytes, &activities); err != nil {
		log.Printf("Błąd parsowania JSON z tt/user: %v", err)
		c.JSON(http.StatusOK, []models.DashboardUpcomingEvent{})
		return
	}

	// Mapowanie na format frontendowy
	var events []models.DashboardUpcomingEvent
	for _, act := range activities {
		// Parsowanie daty (format USOS: YYYY-MM-DD HH:MM:SS)
		startT, _ := time.Parse("2006-01-02 15:04:05", act.StartTime)
		endT, _ := time.Parse("2006-01-02 15:04:05", act.EndTime)

		timeStr := fmt.Sprintf("%s-%s", startT.Format("15:04"), endT.Format("15:04"))

		// Przypisanie koloru na podstawie typu zajęć
		color := "var(--tertiary)" // Domyślny
		source := "USOS"

		// Dopasuj typy do Twoich zmiennych CSS
		switch strings.ToLower(act.Type) {
		case "lecture", "wykład":
			color = "var(--primary)" // Niebieski
		case "lab", "laboratorium", "laboratory":
			color = "var(--success)" // Zielony
		case "class", "ćwiczenia":
			color = "var(--info)" // Cyan
		case "seminar", "seminarium":
			color = "var(--warning)" // Żółty
		case "exam", "egzamin":
			color = "var(--error)" // Czerwony
		}

		// Wybierz nazwę (PL lub EN)
		title := act.Name.PL
		if title == "" {
			title = act.Name.EN
		}

		events = append(events, models.DashboardUpcomingEvent{
			ID:     act.StartTime + act.CourseID, // Unikalny klucz
			Type:   act.Type,                     // Lub przetłumaczony typ
			Title:  title,
			Time:   timeStr,
			Source: source,
			Color:  color,
		})
	}

	c.JSON(http.StatusOK, events)
}

// HandleGetDashboardProgress - Pobiera ostatni aktywny temat
func HandleGetDashboardProgress(c *gin.Context) {
	session := sessions.Default(c)
	userUsosID := session.Get("user_usos_id").(string)

	progress, err := db.UserRepository.GetLastUserProgress(userUsosID)
	if err != nil {
		// Prawdziwy błąd bazy
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	if progress == nil {
		// Brak danych - to normalne, zwróć null JSON
		c.JSON(http.StatusOK, nil)
		return
	}

	// Mapowanie
	response := models.DashboardProgress{
		Subject:  progress.Topic.Subject.Name,
		Topic:    progress.Topic.Name,
		Progress: progress.Progress,
		Required: 80, // Można to przenieść do bazy danych (Topic.PassingScore)
	}
	c.JSON(http.StatusOK, response)
}

// HandleGetDashboardAchievements - Pobiera zdobyte odznaki
func HandleGetDashboardAchievements(c *gin.Context) {
	session := sessions.Default(c)
	userUsosID := session.Get("user_usos_id").(string)

	achievements, err := db.UserRepository.GetUserAchievements(userUsosID)
	if err != nil {
		c.JSON(http.StatusOK, []models.DashboardAchievement{})
		return
	}

	var response []models.DashboardAchievement
	for _, ua := range achievements {
		response = append(response, models.DashboardAchievement{
			ID:          ua.Achievement.ID,
			Name:        ua.Achievement.Name,
			Description: ua.Achievement.Description,
			IconCode:    ua.Achievement.IconCode,
			UnlockedAt:  ua.UnlockedAt.Format("2006-01-02"),
		})
	}

	c.JSON(http.StatusOK, response)
}

// HandleGetDashboardLeaderboard - Mock rankingu (do czasu implementacji gamifikacji)
func HandleGetDashboardLeaderboard(c *gin.Context) {
	// Tutaj docelowo: zapytanie SQL o top 3 + aktualny user
	ranking := []models.DashboardLeaderboardEntry{
		{Rank: 1, Name: "Anna N.", Score: 12500, IsCurrentUser: false},
		{Rank: 2, Name: "Ty", Score: 11800, IsCurrentUser: true},
		{Rank: 3, Name: "Paweł K.", Score: 11750, IsCurrentUser: false},
	}
	c.JSON(http.StatusOK, ranking)
}
func HandleContentUpload(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	form, err := c.MultipartForm()
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Błąd parsowania formularza: "+err.Error())
		return
	}

	genType := form.Value["type"][0]
	notes := form.Value["notes"][0]
	topicIDStr := form.Value["topic_id"][0]
	topicID, err := strconv.ParseUint(topicIDStr, 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe ID tematu")
		return
	}

	files := form.File["images"]
	var parts []genai.Part

	for _, file := range files {
		log.Printf("Przetwarzanie pliku: %s", file.Filename)
		openedFile, err := file.Open()
		if err != nil {
			utils.SendError(c, http.StatusInternalServerError, "Błąd otwierania pliku")
			return
		}
		defer openedFile.Close()

		fileBytes, err := io.ReadAll(openedFile)
		if err != nil {
			utils.SendError(c, http.StatusInternalServerError, "Błąd czytania pliku")
			return
		}

		mimeType := http.DetectContentType(fileBytes)
		if strings.HasSuffix(file.Filename, ".png") {
			mimeType = "image/png"
		}
		if strings.HasSuffix(file.Filename, ".jpg") || strings.HasSuffix(file.Filename, ".jpeg") {
			mimeType = "image/jpeg"
		}

		parts = append(parts, genai.ImageData(mimeType, fileBytes))
	}

	prompt := buildGenerationPrompt(genType, notes)

	geminiResponse, err := services.GeminiService.GenerateContent(context.Background(), prompt, parts)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Zapis do bazy danych
	err = saveGeneratedContent(geminiResponse, genType, uint(topicID), userUsosID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd zapisu wygenerowanych treści: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusCreated, gin.H{
		"message": "Treści pomyślnie wygenerowane i wysłane do moderacji.",
	})
}

// saveGeneratedContent parsuje JSON z Gemini i zapisuje w DB
func saveGeneratedContent(jsonResponse, genType string, topicID uint, userUsosID string) error {
	// Usuwamy znaczniki Markdown, jeśli AI je dodało
	jsonResponse = strings.TrimPrefix(jsonResponse, "```json\n")
	jsonResponse = strings.TrimSuffix(jsonResponse, "\n```")

	switch genType {
	case "flashcards":
		var flashcards []models.GeneratedFlashcard
		if err := json.Unmarshal([]byte(jsonResponse), &flashcards); err != nil {
			return fmt.Errorf("błąd parsowania JSON fiszek: %w", err)
		}
		for _, fc := range flashcards {
			dbModel := models.Flashcard{
				TopicID:         topicID,
				Question:        fc.Question,
				Answer:          fc.Answer,
				Status:          "pending",
				CreatedByUsosID: userUsosID,
			}
			if err := db.UserRepository.CreateFlashcard(&dbModel); err != nil {
				log.Printf("Błąd zapisu fiszki do DB: %v", err)
			}
		}

	case "quiz":
		var questions []models.GeneratedQuizQuestion
		if err := json.Unmarshal([]byte(jsonResponse), &questions); err != nil {
			return fmt.Errorf("błąd parsowania JSON quizu: %w", err)
		}
		for _, q := range questions {
			dbModel := models.QuizQuestion{
				TopicID:            topicID,
				QuestionText:       q.Question,
				Options:            q.Options,
				CorrectOptionIndex: q.CorrectIndex,
				Status:             "pending",
				CreatedByUsosID:    userUsosID,
			}
			if err := db.UserRepository.CreateQuizQuestion(&dbModel); err != nil {
				log.Printf("Błąd zapisu pytania do DB: %v", err)
			}
		}
	}
	return nil
}

// HandleManualFlashcard (do ręcznego dodawania fiszek)
func HandleManualFlashcard(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	var req struct {
		TopicID  uint   `json:"topicId" binding:"required"`
		Question string `json:"question" binding:"required"`
		Answer   string `json:"answer" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe dane: "+err.Error())
		return
	}

	flashcard := &models.Flashcard{
		TopicID:         req.TopicID,
		Question:        req.Question,
		Answer:          req.Answer,
		Status:          "pending", // Ręczne też muszą być zatwierdzone
		CreatedByUsosID: userUsosID,
	}

	if err := db.UserRepository.CreateFlashcard(flashcard); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd zapisu fiszki: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusCreated, gin.H{"message": "Fiszka wysłana do moderacji."})
}

// buildGenerationPrompt tworzy instrukcję dla AI
func buildGenerationPrompt(genType string, notes string) string {
	basePrompt := fmt.Sprintf(
		"Jesteś ekspertem akademickim. Przeanalizuj poniższe materiały (slajdy i notatki). Twoim zadaniem jest wygenerowanie materiałów do nauki. Zwracasz TYLKO format JSON.\n\nMateriały dodatkowe (tekst):\n%s\n\n",
		notes,
	)

	switch genType {
	case "flashcards":
		return basePrompt + `Wygeneruj 10 fiszek. Użyj DOKŁADNIE tego formatu JSON:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`
	case "quiz":
		return basePrompt + `Wygeneruj 5 pytań quizowych (wielokrotnego wyboru, 4 opcje, 1 poprawna). Użyj DOKŁADNIE tego formatu JSON:
[
  {
    "question": "...",
    "options": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],
    "correctIndex": 0
  }
]`
	case "summary":
		return basePrompt + `Wygeneruj podsumowanie (kluczowe punkty) w formacie Markdown. Użyj DOKŁADNIE tego formatu JSON:
{
  "summary": "### Nagłówek 1\n- Punkt 1\n- Punkt 2\n\n### Nagłówek 2\n- Punkt 3"
}`
	default:
		return basePrompt + "Wygeneruj proste podsumowanie tekstu."
	}
}

func HandleGetAllUserGroups(c *gin.Context) {
	log.Println("--- HandleGetAllUserGroups: START ---")

	// 1. Pobierz ID użytkownika USOS z kontekstu (ustawione przez AuthRequired)
	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		utils.SendError(c, http.StatusUnauthorized, "Nie znaleziono ID użytkownika w kontekście.")
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		utils.SendError(c, http.StatusUnauthorized, "Nieprawidłowy format ID użytkownika.")
		return
	}

	// 2. Pobierz Token Użytkownika z bazy danych
	// Ta metoda jest teraz dostępna po dodaniu jej w db.go
	token, err := db.UserRepository.GetUserTokenByUsosID(userUsosID)
	if err != nil {
		log.Printf("HandleGetAllUserGroups: Błąd pobierania tokenu z BD dla %s: %v", userUsosID, err)
		// Internal Server Error w przypadku błędu BD lub braku tokenu.
		utils.SendError(c, http.StatusInternalServerError, "Nie można pobrać tokenu USOS użytkownika lub token nie istnieje.")
		return
	}

	// 3. Wywołaj serwis USOS
	usosData, err := services.UsosService.GetAllUserGroups(token.AccessToken, token.AccessSecret)
	if err != nil {
		log.Printf("HandleGetAllUserGroups: Błąd wywołania USOS API: %v", err)
		// Przekazanie błędu z API USOS
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania danych z USOS API: "+err.Error())
		return
	}

	// 4. Sukces
	log.Println("--- HandleGetAllUserGroups: SUCCESS ---")
	utils.SendSuccess(c, http.StatusOK, usosData)
}
func HandleApiProxy(c *gin.Context) {
	session := sessions.Default(c)
	userUsosIDValue := session.Get("user_usos_id") // Klucz musi być zgodny z tym, co ustawiasz w AuthRequired
	if userUsosIDValue == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Brak autoryzacji"})
		return
	}
	userUsosID := userUsosIDValue.(string)

	proxyPath := c.Param("proxyPath")
	queryParams := c.Request.URL.RawQuery

	// Wyczyść ścieżkę (usuń wiodący /)
	cleanPath := strings.TrimPrefix(proxyPath, "/")

	log.Printf("HandleApiProxy: Proxying request for user %s to path '%s'", userUsosID, cleanPath)

	// --- POPRAWKA ---
	// Użyj publicznej, zainicjowanej zmiennej z pakietu services
	resp, err := services.UsosService.MakeSignedRequest(userUsosID, cleanPath, queryParams)
	if err != nil {
		log.Printf("HandleApiProxy: Error from MakeSignedRequest: %v", err)
		// Sprawdź, czy odpowiedź nie jest nil, zanim zwrócisz status
		statusCode := http.StatusInternalServerError
		if resp != nil {
			statusCode = resp.StatusCode
		}
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	// Przekaż odpowiedź z USOS (JSON, błąd, cokolwiek) z powrotem do frontendu
	// Kopiujemy nagłówki i treść
	c.Status(resp.StatusCode)
	// Ustawiamy Content-Type, ponieważ GIN lubi go nadpisywać
	c.Header("Content-Type", resp.Header.Get("Content-Type"))

	io.Copy(c.Writer, resp.Body)
}

type CreateTopicRequest struct {
	SubjectID uint   `json:"subject_id" binding:"required"`
	Name      string `json:"name" binding:"required"`
}

func HandleCreateTopic(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	var req CreateTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe dane: "+err.Error())
		return
	}

	topic := &models.Topic{
		SubjectID:       req.SubjectID,
		Name:            req.Name,
		CreatedByUsosID: userUsosID,
	}

	if err := db.UserRepository.CreateTopic(topic); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd zapisu tematu: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusCreated, topic)
}
func HandleGetUserMe(c *gin.Context) {
	log.Println("--- HandleGetUserMe: START ---")

	// Używamy "user_usos_id" (lub cokolwiek ustawiłeś w middleware)
	userUsosIDValue, exists := c.Get("user_usos_id")
	if !exists {
		log.Println("HandleGetUserMe: FAILED. 'user_usos_id' NOT FOUND in Gin context.")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context (me)"})
		return
	}
	userUsosID, ok := userUsosIDValue.(string)
	if !ok || userUsosID == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid User ID in context (me)"})
		return
	}

	// --- POPRAWKA ---
	// Używamy publicznej zmiennej `db.UserRepository`
	user, err := db.UserRepository.GetUserByUsosID(userUsosID)
	if err != nil {
		log.Printf("HandleGetUserMe: FAILED. User %s not found in DB: %v", userUsosID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Nie znaleziono użytkownika w bazie danych"})
		return
	}

	log.Printf("HandleGetUserMe: SUCCESS. Returning user %s from DB.", userUsosID)
	log.Println("--- HandleGetUserMe: END ---")

	c.JSON(http.StatusOK, gin.H{
		"id":         user.UsosID,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"email":      user.Email,
	})
}
