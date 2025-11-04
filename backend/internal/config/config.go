package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	UsosConsumerKey    string `mapstructure:"USOS_CONSUMER_KEY"`
	UsosConsumerSecret string `mapstructure:"USOS_CONSUMER_SECRET"`
	AppBaseURL         string `mapstructure:"APP_BASE_URL"`
	FrontendURL        string `mapstructure:"FRONTEND_URL"`
	UsosApiBaseURL     string `mapstructure:"USOS_API_BASE_URL"`
	DBHost             string `mapstructure:"DB_HOST"`
	DBPort             string `mapstructure:"DB_PORT"`
	DBUser             string `mapstructure:"DB_USER"`
	DBPassword         string `mapstructure:"DB_PASSWORD"`
	DBName             string `mapstructure:"DB_NAME"`
	DBSSLMode          string `mapstructure:"DB_SSLMODE"`
	SessionSecret      string `mapstructure:"SESSION_SECRET"`
}

var AppConfig Config

func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			log.Printf("Błąd odczytu pliku konfiguracyjnego: %s", err)
		} else {
			log.Println("Plik .env nie znaleziony, poleganie na zmiennych środowiskowych.")
		}
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		log.Fatalf("Nie można zmapować konfiguracji do struktury: %v", err)
	}

	if config.UsosConsumerKey == "" || config.UsosConsumerSecret == "" {
		log.Fatal("USOS_CONSUMER_KEY i USOS_CONSUMER_SECRET muszą być ustawione")
	}
	if config.SessionSecret == "" {
		log.Fatal("SESSION_SECRET musi być ustawiony")
	}
	if config.UsosApiBaseURL == "" {
		log.Fatal("USOS_API_BASE_URL musi być ustawiony")
	}

	AppConfig = config
	log.Printf("Konfiguracja załadowana. USOS API Base URL: %s", AppConfig.UsosApiBaseURL)
	return AppConfig, nil
}
