package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleGetPendingFlashcards (Pełna implementacja)
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
