package models

import (
	"time"

	"github.com/lib/pq"
)

// User reprezentuje użytkownika w Twojej lokalnej bazie danych
type User struct {
	ID        uint   `gorm:"primarykey"`
	UsosID    string `gorm:"unique;not null"`
	FirstName string
	LastName  string
	Email     string `gorm:"unique"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (User) TableName() string {
	return "users"
}

// Token przechowuje tokeny OAuth dla użytkownika w Twojej bazie
type Token struct {
	ID           uint   `gorm:"primarykey"`
	UserUsosID   string `gorm:"unique;not null"`
	AccessToken  string
	AccessSecret string

	// --- NOWE POLE ---
	// Zapiszemy tutaj listę uprawnień, np. "studies|email|grades"
	Scopes string
	// --- KONIEC POPRAWKI ---

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (Token) TableName() string {
	return "tokens"
}

// UsosUserInfo to struktura odpowiedzi z API USOS (dla /services/users/user)
type UsosUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

// Przedmioty (pobrane z USOS lub stworzone przez użytkownika)
type Subject struct {
	ID     uint   `gorm:"primarykey"`
	UserID uint   // Kto jest właścicielem (klucz obcy do User)
	Name   string `gorm:"not null"` // Np. "Analiza Matematyczna"
}

func (Subject) TableName() string { return "subjects" }

// Tematy/Działy (powiązane z przedmiotem)
type Topic struct {
	ID        uint   `gorm:"primarykey"`
	SubjectID uint   `gorm:"not null"` // Klucz obcy do Subject
	Name      string `gorm:"not null"` // Np. "Pochodne i całki"
}

func (Topic) TableName() string { return "topics" }

// Notatki Źródłowe (to, co wrzuci użytkownik)
type SourceNote struct {
	ID        uint   `gorm:"primarykey"`
	TopicID   uint   `gorm:"not null"`  // Klucz obcy do Topic
	RawText   string `gorm:"type:text"` // Surowy tekst (z OCR lub .txt)
	CreatedAt time.Time
}

func (SourceNote) TableName() string { return "source_notes" }

// Fiszki (wygenerowane przez AI)
type Flashcard struct {
	ID       uint   `gorm:"primarykey"`
	TopicID  uint   `gorm:"not null"` // Klucz obcy do Topic
	Question string `gorm:"type:text;not null"`
	Answer   string `gorm:"type:text;not null"`
}

func (Flashcard) TableName() string { return "flashcards" }

// Pytania Quizowe (wygenerowane przez AI)
type QuizQuestion struct {
	ID                 uint           `gorm:"primarykey"`
	TopicID            uint           `gorm:"not null"` // Klucz obcy do Topic
	QuestionText       string         `gorm:"type:text;not null"`
	Options            pq.StringArray `gorm:"type:text[]"` // Odpowiedzi A, B, C, D
	CorrectOptionIndex int            `gorm:"not null"`    // Np. 0 (dla A)
}

func (QuizQuestion) TableName() string { return "quiz_questions" }

// --- ŚLEDZENIE POSTĘPÓW (Powtórki i Liderboardy) ---

// Logika Powtórek (Spaced Repetition)
type FlashcardProgress struct {
	ID           uint      `gorm:"primarykey"`
	UserID       uint      `gorm:"not null"`
	FlashcardID  uint      `gorm:"not null"`
	NextReviewAt time.Time `gorm:"not null"`    // Kiedy pokazać następnym razem
	Repetitions  int       `gorm:"default:0"`   // Ile razy powtórzono
	EaseFactor   float64   `gorm:"default:2.5"` // Algorytm SM-2 (jak Anki)
}

func (FlashcardProgress) TableName() string { return "flashcard_progress" }

// Wyniki Quizów (dla Liderboardów)
type QuizAttempt struct {
	ID        uint `gorm:"primarykey"`
	UserID    uint `gorm:"not null"`
	TopicID   uint `gorm:"not null"`
	Score     int  `gorm:"not null"` // Np. 80 (jako procent)
	CreatedAt time.Time
}

func (QuizAttempt) TableName() string { return "quiz_attempts" }
