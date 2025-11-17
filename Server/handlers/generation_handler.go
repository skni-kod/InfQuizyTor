package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleContentUpload obsługuje przesyłanie plików (obrazów/tekstu) do generowania
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
