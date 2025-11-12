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

// Token przechowuje tokeny OAuth dla użytkownika w Twojej bazie
type Token struct {
	ID           uint   `gorm:"primarykey"`
	UserUsosID   string `gorm:"unique;not null"` // Powiązanie z UsosID użytkownika
	AccessToken  string
	AccessSecret string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// UsosUserInfo to struktura odpowiedzi z API USOS (dla /services/users/user)
// Używamy jej do dekodowania odpowiedzi JSON podczas logowania
type UsosUserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}
