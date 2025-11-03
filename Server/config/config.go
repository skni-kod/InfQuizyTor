package config

import (
	"log"

	"github.com/spf13/viper" // Upewnij się, że ta zależność jest pobrana przez `go mod tidy`
)

// Definicja struktury jest poprawna
type Config struct {
	UsosConsumerKey    string `mapstructure:"USOS_CONSUMER_KEY"`
	UsosConsumerSecret string `mapstructure:"USOS_CONSUMER_SECRET"`
	AppBaseURL         string `mapstructure:"APP_BASE_URL"`
	FrontendURL        string `mapstructure:"FRONTEND_URL"`
	UsosApiBaseURL     string `mapstructure:"USOS_API_BASE_URL"` // Poprawnie dodane
	DBHost             string `mapstructure:"DB_HOST"`
	DBPort             string `mapstructure:"DB_PORT"`
	DBUser             string `mapstructure:"DB_USER"`
	DBPassword         string `mapstructure:"DB_PASSWORD"`
	DBName             string `mapstructure:"DB_NAME"`
	DBSSLMode          string `mapstructure:"DB_SSLMODE"`
	SessionSecret      string `mapstructure:"SESSION_SECRET"`
}

// Globalna zmienna przechowująca załadowaną konfigurację
var AppConfig Config

// Funkcja wczytująca konfigurację
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(".env") // Szuka pliku .env
	viper.SetConfigType("env")
	viper.AutomaticEnv() // Odczytuje również zmienne środowiskowe

	err = viper.ReadInConfig()
	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			// Błąd odczytu pliku (inny niż "nie znaleziono")
			log.Printf("Błąd odczytu pliku konfiguracyjnego: %s", err)
		} else {
			// Pliku .env nie znaleziono, polegaj tylko na zmiennych środowiskowych
			log.Println("Plik .env nie znaleziony, poleganie na zmiennych środowiskowych.")
		}
	}

	// Mapuj wczytane wartości do struktury Config
	err = viper.Unmarshal(&config)
	if err != nil {
		log.Fatalf("Nie można zmapować konfiguracji do struktury: %v", err)
	}

	// Prosta walidacja kluczowych pól
	if config.UsosConsumerKey == "" || config.UsosConsumerSecret == "" {
		log.Fatal("USOS_CONSUMER_KEY i USOS_CONSUMER_SECRET muszą być ustawione")
	}
	if config.SessionSecret == "" {
		log.Fatal("SESSION_SECRET musi być ustawiony")
	}
	if config.UsosApiBaseURL == "" {
		log.Fatal("USOS_API_BASE_URL musi być ustawiony (np. na serwer mock lub prawdziwe API)")
	}

	AppConfig = config // Ustaw globalną konfigurację
	log.Printf("Konfiguracja załadowana. USOS API Base URL: %s", AppConfig.UsosApiBaseURL)
	return AppConfig, nil
}
