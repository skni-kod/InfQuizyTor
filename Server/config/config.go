package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config przechowuje całą konfigurację
type Config struct {
	// USOS API Credentials
	UsosConsumerKey    string `mapstructure:"USOS_CONSUMER_KEY"`
	UsosConsumerSecret string `mapstructure:"USOS_CONSUMER_SECRET"`

	// Application URLs
	AppBaseURL     string `mapstructure:"APP_BASE_URL"`      // http://localhost:8080
	FrontendURL    string `mapstructure:"FRONTEND_URL"`      // http://localhost:5173
	UsosApiBaseURL string `mapstructure:"USOS_API_BASE_URL"` // https://usosapps.prz.edu.pl

	// Database Connection
	DBHost     string `mapstructure:"DB_HOST"`
	DBPort     string `mapstructure:"DB_PORT"`
	DBUser     string `mapstructure:"DB_USER"`
	DBPassword string `mapstructure:"DB_PASSWORD"`
	DBName     string `mapstructure:"DB_NAME"`
	DBSslMode  string `mapstructure:"DB_SSLMODE"`

	// Session Secret
	SessionSecret string `mapstructure:"SESSION_SECRET"`

	// Złożone adresy URL (zostaną zbudowane automatycznie)
	DatabaseURL         string
	UsosCallbackURL     string
	UsosRequestTokenURL string
	UsosAuthorizeURL    string
	UsosAccessTokenURL  string
}

// LoadConfig wczytuje konfigurację z pliku .env w danym folderze
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)

	// --- POPRAWKA TUTAJ ---
	// Szukamy pliku o nazwie ".env"
	viper.SetConfigName(".env")
	// --- KONIEC POPRAWKI ---

	viper.SetConfigType("env")
	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		// Jeśli pliku nie ma, ten błąd pojawi się jako pierwszy
		return
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		return
	}

	// --- Automatyczne budowanie złożonych URL-i ---
	config.DatabaseURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		config.DBUser,
		config.DBPassword,
		config.DBHost,
		config.DBPort,
		config.DBName,
		config.DBSslMode,
	)

	config.UsosRequestTokenURL = config.UsosApiBaseURL + "/services/oauth/request_token"
	config.UsosAuthorizeURL = config.UsosApiBaseURL + "/services/oauth/authorize"
	config.UsosAccessTokenURL = config.UsosApiBaseURL + "/services/oauth/access_token"
	config.UsosCallbackURL = config.AppBaseURL + "/auth/usos/callback"

	return
}
