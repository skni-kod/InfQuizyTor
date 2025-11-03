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
	// --- ADD THIS LINE ---
	UsosApiBaseURL string `mapstructure:"USOS_API_BASE_URL"` // For switching between mock/real API
	// --- END ADD ---
	DBHost        string `mapstructure:"DB_HOST"`
	DBPort        string `mapstructure:"DB_PORT"`
	DBUser        string `mapstructure:"DB_USER"`
	DBPassword    string `mapstructure:"DB_PASSWORD"`
	DBName        string `mapstructure:"DB_NAME"`
	DBSSLMode     string `mapstructure:"DB_SSLMODE"`
	SessionSecret string `mapstructure:"SESSION_SECRET"`
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
			log.Printf("Error reading config file: %s", err)
			// Don't return here if only file not found, env vars might be set
		} else {
			log.Println("Config file (.env) not found, relying on environment variables.")
		}
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		log.Fatalf("Unable to decode config into struct: %v", err)
	}

	// Basic validation
	if config.UsosConsumerKey == "" || config.UsosConsumerSecret == "" {
		log.Fatal("USOS_CONSUMER_KEY and USOS_CONSUMER_SECRET must be set")
	}
	if config.SessionSecret == "" {
		log.Fatal("SESSION_SECRET must be set")
	}
	if config.UsosApiBaseURL == "" {
		log.Fatal("USOS_API_BASE_URL must be set in .env or environment")
	} // Validate new var

	AppConfig = config
	log.Printf("Configuration loaded. USOS API Base URL: %s", AppConfig.UsosApiBaseURL)
	return AppConfig, nil // Return the loaded config
}
