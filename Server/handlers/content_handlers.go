package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleGetTopicContent zwraca zatwierdzone materiały dla danego tematu
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
