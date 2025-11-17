package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/models" // Poprawnie importujemy modele
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleGetAllCalendarEvents łączy dane z USOS i naszej bazy
func HandleGetAllCalendarEvents(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	// Używamy userUsosID, aby kod się kompilował
	log.Printf("Pobieranie wydarzeń kalendarza dla użytkownika %s (TODO: Implementacja)", userUsosID)

	// Zwracamy pusty mock, aby frontend mógł działać
	utils.SendSuccess(c, http.StatusOK, gin.H{
		"events": []string{},
		"layers": gin.H{},
	})
}

// HandleGetUserUsosGroups pobiera listę grup, do których należy student
func HandleGetUserUsosGroups(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

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
	Type        string `json:"type" binding:"required"` // 'private' lub 'group'
	UsosGroupID int    `json:"usos_group_id"`           // Wymagane jeśli typ='group'
}

// HandleCreateCalendarLayer tworzy nową warstwę (prywatną lub grupową)
func HandleCreateCalendarLayer(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	var req CreateLayerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe dane: "+err.Error())
		return
	}

	if req.Type == "private" {
		layer := &models.CalendarLayer{ // <-- POPRAWKA: Używamy models.CalendarLayer
			Name:        req.Name,
			Color:       req.Color,
			Type:        "private",
			OwnerUsosID: userUsosID, // <-- POPRAWKA: Używamy userUsosID
		}
		// TODO: db.UserRepository.CreateLayer(layer)
		log.Printf("Tworzenie warstwy prywatnej dla %s (TODO)", userUsosID)
		utils.SendSuccess(c, http.StatusCreated, layer)

	} else if req.Type == "group" {
		// TODO: Sprawdź, czy użytkownik (userUsosID) jest liderem grupy (req.UsosGroupID)

		layer := &models.CalendarLayer{ // <-- POPRAWKA: Używamy models.CalendarLayer
			Name:        req.Name,
			Color:       req.Color,
			Type:        "group",
			UsosGroupID: req.UsosGroupID,
		}
		// TODO: db.UserRepository.CreateLayer(layer)
		log.Printf("Tworzenie warstwy grupowej dla grupy %d przez %s (TODO)", req.UsosGroupID, userUsosID)
		utils.SendSuccess(c, http.StatusCreated, layer)

	} else {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowy typ warstwy. Dozwolone: 'private', 'group'")
	}
}
