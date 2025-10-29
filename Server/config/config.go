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
	viper.SetConfigName(".env") // Look for .env file
	viper.SetConfigType("env")

	viper.AutomaticEnv() // Read matching environment variables

	err = viper.ReadInConfig()
	if err != nil {
		// If .env file not found, it might be okay if using only env vars
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			log.Printf("Error reading config file: %s", err)
			return
		}
		log.Println("Config file (.env) not found, using environment variables.")
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}

	// Basic validation (add more as needed)
	if config.UsosConsumerKey == "" || config.UsosConsumerSecret == "" {
		log.Fatal("USOS_CONSUMER_KEY and USOS_CONSUMER_SECRET must be set")
	}
	if config.SessionSecret == "" {
		log.Fatal("SESSION_SECRET must be set")
	}

	AppConfig = config // Set global AppConfig
	log.Println("Configuration loaded successfully.")
	return
}