package models

import "time"

type UserToken struct {
	UserUsosID        string    `db:"user_usos_id"`
	AccessToken       string    `db:"access_token"`
	AccessTokenSecret string    `db:"access_token_secret"`
	Scopes            []string  `db:"scopes"` // Musi pasować do typu TEXT[] w Postgres
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
}
