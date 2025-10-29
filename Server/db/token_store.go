package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/skni-kod/InfQuizyTor/Server/models" // Adjust import path
)

func SaveUserToken(ctx context.Context, token models.UserToken) error {
	// Use ON CONFLICT for UPSERT functionality
	query := `
        INSERT INTO user_tokens (user_usos_id, access_token, access_token_secret, scopes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (user_usos_id) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            access_token_secret = EXCLUDED.access_token_secret,
            scopes = EXCLUDED.scopes,
            updated_at = NOW();
    `
	_, err := Pool.Exec(ctx, query,
		token.UserUsosID,
		token.AccessToken,
		token.AccessTokenSecret,
		token.Scopes, // pgx handles []string to TEXT[] mapping
	)
	if err != nil {
		log.Printf("Error saving user token for %s: %v", token.UserUsosID, err)
		return err
	}
	log.Printf("Token saved/updated for user %s", token.UserUsosID)
	return nil
}

func GetUserToken(ctx context.Context, userUsosID string) (*models.UserToken, error) {
	query := `
        SELECT user_usos_id, access_token, access_token_secret, scopes, created_at, updated_at
        FROM user_tokens
        WHERE user_usos_id = $1;
    `
	row := Pool.QueryRow(ctx, query, userUsosID)

	var token models.UserToken
	err := row.Scan(
		&token.UserUsosID,
		&token.AccessToken,
		&token.AccessTokenSecret,
		&token.Scopes,
		&token.CreatedAt,
		&token.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("No token found for user %s", userUsosID)
			return nil, nil // Return nil, nil if token not found
		}
		log.Printf("Error getting user token for %s: %v", userUsosID, err)
		return nil, err
	}
	log.Printf("Token retrieved for user %s", userUsosID)
	return &token, nil
}

func DeleteUserToken(ctx context.Context, userUsosID string) error {
	query := `DELETE FROM user_tokens WHERE user_usos_id = $1;`
	_, err := Pool.Exec(ctx, query, userUsosID)
	if err != nil {
		log.Printf("Error deleting token for user %s: %v", userUsosID, err)
		return err
	}
	log.Printf("Token deleted for user %s", userUsosID)
	return nil
}
