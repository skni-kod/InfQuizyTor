package models

import (
	"time"
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
