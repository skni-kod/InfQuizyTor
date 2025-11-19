package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// systemLayers definiuje systemowe, nieusuwalne warstwy.
var systemLayers = map[string]models.CalendarLayer{
	"usos-class": {ID: 999991, Name: "Zajęcia Dydaktyczne USOS", Color: "#005846", Type: "system", OwnerUsosID: ""},
	"usos-exam":  {ID: 999992, Name: "Egzaminy/Kolokwia USOS", Color: "#D32F2F", Type: "system", OwnerUsosID: ""},
}

// HandleGetAllCalendarEvents implementuje pełną logikę pobierania wydarzeń.
func HandleGetAllCalendarEvents(c *gin.Context) {
	userUsosID := c.MustGet("user_usos_id").(string)

	// Domyślne parametry
	startStr := c.DefaultQuery("start", time.Now().Format("2006-01-02"))
	daysStr := c.DefaultQuery("days", "30")
	days, _ := strconv.Atoi(daysStr)

	// Walidacja dni (pozwalmy na więcej, żeby front mógł pobrać zapas)
	if days < 1 {
		days = 7
	}
	if days > 90 {
		days = 90
	} // Max 3 miesiące na raz

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		start = time.Now()
	}
	end := start.AddDate(0, 0, days)

	// 1. POBIERANIE DANYCH Z USOS
	// UWAGA: Zwiększamy limit zapytania do USOS, aby pobrać szerszy kontekst.
	// Endpoint tt/user zazwyczaj obsługuje zakresy większe niż 7 dni (w przeciwieństwie do classgroup).
	usosDays := days
	if usosDays > 60 {
		usosDays = 60
	} // Bezpieczny limit dla API USOS

	usosFields := "start_time|end_time|name|type|url|building_name|room_number|course_name|classtype_name"
	queryParams := fmt.Sprintf("start=%s&days=%d&fields=%s", start.Format("2006-01-02"), usosDays, usosFields)

	var usosActivities []models.UsosActivity
	// Wykonanie zapytania do USOS
	if resp, err := services.UsosService.MakeSignedRequest(userUsosID, "tt/user", queryParams); err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		// Ignorujemy błąd parsowania, jeśli JSON jest pusty lub niepoprawny, lista będzie pusta
		_ = json.Unmarshal(bodyBytes, &usosActivities)
	} else {
		log.Printf("Ostrzeżenie: Błąd pobierania kalendarza USOS dla %s: %v", userUsosID, err)
	}

	// 2. POBIERANIE DANYCH Z BAZY (Warstwy i Eventy)
	var dbEvents []models.CalendarEvent = []models.CalendarEvent{} // Domyślnie pusta lista

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

		// Logika rozpoznawania typu zajęć
		nameLower := strings.ToLower(act.Name.PL)
		typeLower := strings.ToLower(act.Type)
		classTypeLower := strings.ToLower(act.ClasstypeName.PL)

		if classTypeLower == "" {
			classTypeLower = typeLower
		}

		if strings.Contains(classTypeLower, "wykład") {
			eventType = "lecture"
		} else if strings.Contains(classTypeLower, "laboratorium") || strings.Contains(classTypeLower, "projekt") {
			eventType = "lab"
		} else if typeLower == "exam" || strings.Contains(nameLower, "kolokwium") || strings.Contains(nameLower, "egzamin") || strings.Contains(nameLower, "wejściówka") {
			layerID = "usos-exam"
			eventType = "colloquium"
		}

		events = append(events, models.AppCalendarEvent{
			ID:            act.StartTime + act.CourseID,
			LayerID:       layerID,
			Type:          eventType,
			StartTime:     act.StartTime,
			EndTime:       act.EndTime,
			Title:         act.Name.PL, // Często nazwa zajęć jest bardziej opisowa niż nazwa kursu w widoku kalendarza
			Description:   act.CourseName.PL,
			RoomNumber:    act.RoomNumber,
			CourseName:    act.CourseName,
			ClasstypeName: act.ClasstypeName,
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

// HandleGetUserUsosGroups (DODANE - brakujące w Twoim błędzie)
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

// HandleCreateCalendarLayer (DODANE - brakujące w Twoim błędzie)
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
