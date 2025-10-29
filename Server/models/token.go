package models

import "time"

type UserToken struct {
	UserUsosID        string    `db:"user_usos_id"`
	AccessToken       string    `db:"access_token"`
	AccessTokenSecret string    `db:"access_token_secret"`
	Scopes            []string  `db:"scopes"` // pgx handles []string with TEXT[]
	CreatedAt         time.Time `db:"created_at"`
	UpdatedAt         time.Time `db:"updated_at"`
}
