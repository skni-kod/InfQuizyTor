package models

import (
	"time"

	"github.com/lib/pq" // Upewnij się, że masz: go get github.com/lib/pq
)

// --- MODELE PODSTAWOWE ---

type User struct {
	ID        uint   `gorm:"primarykey"`
	UsosID    string `gorm:"unique;not null"`
	FirstName string
	LastName  string
	Email     string `gorm:"unique"`
	Role      string `gorm:"default:'student';not null"` // 'student' lub 'admin'
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (User) TableName() string { return "users" }

type Token struct {
	ID           uint   `gorm:"primarykey"`
	UserUsosID   string `gorm:"unique;not null"`
	AccessToken  string
	AccessSecret string
	Scopes       string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (Token) TableName() string { return "tokens" }

// --- MODELE TREŚCI (AI / NAUKA) ---

type Subject struct {
	ID     uint   `gorm:"primarykey"`
	UsosID string `gorm:"unique;not null"`
	Name   string `gorm:"not null"`
}

func (Subject) TableName() string { return "subjects" }

type Topic struct {
	ID              uint   `gorm:"primarykey"`
	SubjectID       uint   `gorm:"not null;index"`
	Name            string `gorm:"not null"`
	CreatedByUsosID string `gorm:"not null"`
}

func (Topic) TableName() string { return "topics" }

type Flashcard struct {
	ID              uint   `gorm:"primarykey"`
	TopicID         uint   `gorm:"not null;index"`
	Question        string `gorm:"type:text;not null"`
	Answer          string `gorm:"type:text;not null"`
	Status          string `gorm:"default:'pending';not null;index"`
	CreatedByUsosID string `gorm:"not null"`
}

func (Flashcard) TableName() string { return "flashcards" }

type QuizQuestion struct {
	ID                 uint           `gorm:"primarykey"`
	TopicID            uint           `gorm:"not null;index"`
	QuestionText       string         `gorm:"type:text;not null"`
	Options            pq.StringArray `gorm:"type:text[]"`
	CorrectOptionIndex int            `gorm:"not null"`
	Status             string         `gorm:"default:'pending';not null;index"`
	CreatedByUsosID    string         `gorm:"not null"`
}

func (QuizQuestion) TableName() string { return "quiz_questions" }

// --- MODELE KALENDARZA I GRUP ---

type UserGroupRole struct {
	ID          uint   `gorm:"primarykey"`
	UserUsosID  string `gorm:"not null;index"`
	UsosGroupID int    `gorm:"not null;index"`
	Role        string `gorm:"not null"` // np. "leader"
}

func (UserGroupRole) TableName() string { return "user_group_roles" }

type CalendarLayer struct {
	ID          uint   `gorm:"primarykey"`
	Name        string `gorm:"not null"`
	Color       string `gorm:"not null"`
	Type        string `gorm:"not null;index"` // 'private' lub 'group'
	OwnerUsosID string `gorm:"index;null"`
	UsosGroupID int    `gorm:"index;null"`
}

func (CalendarLayer) TableName() string { return "calendar_layers" }

type CalendarEvent struct {
	ID          uint      `gorm:"primarykey"`
	LayerID     uint      `gorm:"not null;index"`
	Title       string    `gorm:"not null"`
	StartTime   time.Time `gorm:"not null"`
	EndTime     time.Time
	Description string `gorm:"type:text"`
}

func (CalendarEvent) TableName() string { return "calendar_events" }

// --- TYPY DO DEKODOWANIA (USOS i Gemini) ---

type UsosUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}
type LangDict struct {
	PL string `json:"pl"`
	EN string `json:"en"`
}
type UsosCourseEdition struct {
	CourseID   string   `json:"course_id"`
	CourseName LangDict `json:"course_name"`
}
type UsosUserCoursesResponse struct {
	CourseEditions map[string][]UsosCourseEdition `json:"course_editions"`
}
type UsosUserGroup struct {
	CourseUnitID string   `json:"course_unit_id"`
	GroupID      int      `json:"group_number"`
	CourseName   LangDict `json:"course_name"`
	ClassType    LangDict `json:"class_type"`
}
type GeneratedFlashcard struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}
type GeneratedQuizQuestion struct {
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correctIndex"`
}
