package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

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
