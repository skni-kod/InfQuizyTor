package services

import (
	"context"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
	"github.com/skni-kod/InfQuizyTor/Server/config"
	"google.golang.org/api/option"
)

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
