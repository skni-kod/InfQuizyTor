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
