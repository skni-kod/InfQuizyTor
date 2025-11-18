package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleGetUpcomingEvents - Pobiera plan zajęć z USOS i formatuje dla widgetu
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
