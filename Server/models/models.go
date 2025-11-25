package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// --- MODELE PODSTAWOWE ---

type User struct {
	ID        uint   `gorm:"primarykey"`
	UsosID    string `gorm:"unique;not null"`
	FirstName string
	LastName  string
	Email     string `gorm:"unique"`
	Role      string `gorm:"default:'student';not null"`
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
	ID              uint    `gorm:"primarykey"`
	SubjectID       uint    `gorm:"not null;index"`
	Subject         Subject `gorm:"foreignKey:SubjectID"` // <--- NAPRAWIONO: Dodano relację
	Name            string  `gorm:"not null"`
	CreatedByUsosID string  `gorm:"not null"`
}

func (Topic) TableName() string { return "topics" }

type QuizNode struct {
	gorm.Model
	UsosCourseID string        `gorm:"index;not null"`
	Title        string        `gorm:"not null"`
	Dependencies pq.Int64Array `gorm:"type:integer[]"`
}

func (QuizNode) TableName() string { return "quiz_nodes" }

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

// --- MODELE DASHBOARDU ---

type UserProgress struct {
	ID         uint   `gorm:"primarykey"`
	UserUsosID string `gorm:"not null;index"`
	TopicID    uint   `gorm:"not null"`
	Topic      Topic  `gorm:"foreignKey:TopicID"`
	Progress   int    `gorm:"default:0"`
	UpdatedAt  time.Time
}

func (UserProgress) TableName() string { return "user_progress" }

type Achievement struct {
	ID          uint   `gorm:"primarykey"`
	Name        string `gorm:"not null"`
	Description string
	IconCode    string
}

func (Achievement) TableName() string { return "achievements" }

type UserAchievement struct {
	ID            uint        `gorm:"primarykey"`
	UserUsosID    string      `gorm:"not null;index"`
	AchievementID uint        `gorm:"not null"`
	Achievement   Achievement `gorm:"foreignKey:AchievementID"`
	UnlockedAt    time.Time   `gorm:"autoCreateTime"`
}

func (UserAchievement) TableName() string { return "user_achievements" }

// --- MODELE KALENDARZA I GRUP ---
type CalendarLayer struct {
	ID          uint   `gorm:"primarykey"`
	Name        string `gorm:"not null"`
	Color       string `gorm:"not null"`
	Type        string `gorm:"not null;index"`
	OwnerUsosID string `gorm:"index;null"`
	UsosGroupID int    `gorm:"index;null"`
}

type CalendarEvent struct {
	ID          uint      `gorm:"primarykey"`
	LayerID     uint      `gorm:"not null;index"`
	Title       string    `gorm:"not null"`
	StartTime   time.Time `gorm:"not null"`
	EndTime     time.Time
	Description string `gorm:"type:text"`
}

func (CalendarEvent) TableName() string { return "calendar_events" }

// --- STRUKTURY API (Backend <-> Frontend) ---

type DashboardUpcomingEvent struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Title  string `json:"title"`
	Time   string `json:"time"`
	Source string `json:"source"`
	Color  string `json:"color"`
}

type DashboardLeaderboardEntry struct {
	Rank          int    `json:"rank"`
	Name          string `json:"name"`
	Score         int    `json:"score"`
	IsCurrentUser bool   `json:"isCurrentUser"`
}

type DashboardProgress struct {
	Subject  string `json:"subject"`
	Topic    string `json:"topic"`
	Progress int    `json:"progress"`
	Required int    `json:"required,omitempty"`
}

type DashboardAchievement struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IconCode    string `json:"icon_code"`
	UnlockedAt  string `json:"unlocked_at"`
}
type AppCalendarEvent struct {
	ID            string   `json:"id"`
	StartTime     string   `json:"start_time"`
	EndTime       string   `json:"end_time,omitempty"`
	LayerID       string   `json:"layerId"`
	Title         string   `json:"title,omitempty"`
	Type          string   `json:"type,omitempty"` // 'class' | 'exam' | 'colloquium' | 'sport' | 'private' | 'other'
	Description   string   `json:"description,omitempty"`
	URL           string   `json:"url,omitempty"`
	BuildingName  LangDict `json:"building_name,omitempty"`
	RoomNumber    string   `json:"room_number,omitempty"`
	CourseName    LangDict `json:"course_name,omitempty"`
	ClasstypeName LangDict `json:"classtype_name,omitempty"`
	Name          LangDict `json:"name,omitempty"`
}

type AppCalendarResponse struct {
	Events []AppCalendarEvent                 `json:"events"`
	Layers map[string]CalendarLayerDefinition `json:"layers"`
}
type CalendarLayerDefinition struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	IsSystem bool   `json:"isSystem"`
}

// --- TYPY DO DEKODOWANIA (USOS) ---

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
	TermID     string   `json:"term_id"`
}
type UsosUserCoursesResponse struct {
	CourseEditions map[string][]UsosCourseEdition `json:"course_editions"`
}

// <--- NAPRAWIONO: Dodano brakującą strukturę UsosUserGroup
type UsosUserGroup struct {
	CourseUnitID string   `json:"course_unit_id"`
	GroupID      int      `json:"group_number"`
	CourseName   LangDict `json:"course_name"`
	ClassType    LangDict `json:"class_type"`
}
type UsosActivity struct {
	StartTime     string   `json:"start_time"`
	EndTime       string   `json:"end_time"`
	Name          LangDict `json:"name"`
	Type          string   `json:"type"`
	RoomNumber    string   `json:"room_number"`
	CourseID      string   `json:"course_id"`
	ClasstypeName LangDict `json:"classtype_name,omitempty"`
	CourseName    LangDict `json:"course_name"`
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

// UsosGroupMember reprezentuje prowadzącego lub uczestnika
type UsosGroupMember struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Title     string `json:"titles,omitempty"` // Opcjonalne
}

// UsosGroupDetails to pełna struktura grupy z dokumentacji
type UsosGroupDetails struct {
	CourseUnitID string            `json:"course_unit_id"`
	GroupNumber  int               `json:"group_number"`
	ClassType    LangDict          `json:"class_type"`
	ClassTypeID  string            `json:"class_type_id"`
	CourseID     string            `json:"course_id"`
	CourseName   LangDict          `json:"course_name"`
	GroupURL     string            `json:"group_url"`
	TermID       string            `json:"term_id"`
	Lecturers    []UsosGroupMember `json:"lecturers"`
	Participants []UsosGroupMember `json:"participants"`      // Wymaga uprawnień uczestnika/prowadzącego
	Relationship string            `json:"relationship_type"` // participant lub lecturer
}

// UsosGroupsResponse mapuje odpowiedź z services/groups/user
// USOS zwraca strukturę: { "groups": { "TERM_ID": [Group1, Group2] }, "terms": [...] }
type UsosGroupsResponse struct {
	Groups map[string][]UsosGroupDetails `json:"groups"`
	Terms  []UsosTerm                    `json:"terms"`
}

type UsosTerm struct {
	ID        string   `json:"id"`
	Name      LangDict `json:"name"`
	StartDate string   `json:"start_date"`
	EndDate   string   `json:"end_date"`
}

type UserToken struct {
	UserUsosID        string    `db:"user_usos_id"`
	AccessToken       string    `db:"access_token"`
	AccessTokenSecret string    `db:"access_token_secret"`
	Scopes            []string  `db:"scopes"` // Musi pasować do typu TEXT[] w Postgres
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
}
