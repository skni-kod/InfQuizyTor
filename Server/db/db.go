package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/skni-kod/InfQuizyTor/Server/config" // Adjust import path
)

var Pool *pgxpool.Pool

func InitDB(cfg config.Config) {
	connString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode)

	var err error
	Pool, err = pgxpool.New(context.Background(), connString)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	// Optional: Ping the database to verify connection
	err = Pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Database ping failed: %v\n", err)
		os.Exit(1)
	}

	log.Println("Database connection established successfully.")
	// Consider running migrations here if using a migration tool
}

func CloseDB() {
	if Pool != nil {
		Pool.Close()
		log.Println("Database connection pool closed.")
	}
}
