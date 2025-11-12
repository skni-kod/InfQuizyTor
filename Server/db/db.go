package db

import (
	"log"

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// UserRepository jest teraz publiczną (eksportowaną) zmienną
var UserRepository *GormUserRepository

// GormUserRepository implementuje logikę bazy danych
type GormUserRepository struct {
	DB *gorm.DB
}

func InitDB(cfg config.Config) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Nie można połączyć się z bazą danych: %v", err)
	}

	log.Println("Uruchamianie automigracji bazy danych...")
	db.AutoMigrate(&models.User{}, &models.Token{})

	// Przypisujemy instancję do naszej publicznej zmiennej
	UserRepository = NewGormUserRepository(db)
	log.Println("Repozytorium użytkowników pomyślnie zainicjowane.")
}

func NewGormUserRepository(db *gorm.DB) *GormUserRepository {
	return &GormUserRepository{DB: db}
}

// CloseDB (Dla main.go)
func CloseDB() {
	if UserRepository != nil {
		sqlDB, err := UserRepository.DB.DB()
		if err == nil {
			log.Println("Zamykanie połączenia z bazą danych.")
			sqlDB.Close()
		}
	}
}

// --- Metody repozytorium ---

func (r *GormUserRepository) GetUserByUsosID(usosID string) (*models.User, error) {
	var user models.User
	if err := r.DB.Where("usos_id = ?", usosID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) CreateOrUpdateUser(user *models.User) error {
	return r.DB.Where(models.User{UsosID: user.UsosID}).Assign(user).FirstOrCreate(user).Error
}

func (r *GormUserRepository) SaveToken(token *models.Token) error {
	return r.DB.Where(models.Token{UserUsosID: token.UserUsosID}).Assign(token).FirstOrCreate(token).Error
}

func (r *GormUserRepository) GetTokenByUsosID(usosID string) (*models.Token, error) {
	var token models.Token
	if err := r.DB.Where("user_usos_id = ?", usosID).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}
