package db

import (
	"log"

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause" // Import wymagany do obsługi UPSERT (OnConflict)
)

// Globalna instancja repozytorium
var UserRepository *GormUserRepository

type GormUserRepository struct {
	DB *gorm.DB
}

func InitDB(cfg config.Config) {
	// Połączenie GORM
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Nie można połączyć się z bazą danych: %v", err)
	}

	log.Println("Uruchamianie automigracji bazy danych...")
	// Automigracja tworzy tabele, jeśli nie istnieją
	err = db.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.Subject{},
		&models.Topic{},
		&models.Flashcard{},
		&models.QuizQuestion{},
		&models.UserGroupRole{},
		&models.CalendarLayer{},
		&models.CalendarEvent{},
		&models.QuizNode{},
	)
	if err != nil {
		log.Fatalf("Błąd automigracji: %v", err)
	}

	// Inicjalizacja globalnej zmiennej
	UserRepository = NewGormUserRepository(db)
	log.Println("Repozytorium użytkowników pomyślnie zainicjowane.")
}

func NewGormUserRepository(db *gorm.DB) *GormUserRepository {
	return &GormUserRepository{DB: db}
}

func CloseDB() {
	if UserRepository != nil {
		sqlDB, err := UserRepository.DB.DB()
		if err == nil {
			log.Println("Zamykanie połączenia z bazą danych.")
			sqlDB.Close()
		}
	}
}

// --- Metody User ---

func (r *GormUserRepository) GetUserByUsosID(usosID string) (*models.User, error) {
	var user models.User
	if err := r.DB.Where("usos_id = ?", usosID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) CreateOrUpdateUser(user *models.User) error {
	// Używa FirstOrCreate lub aktualizuje atrybuty
	return r.DB.Where(models.User{UsosID: user.UsosID}).Assign(user).FirstOrCreate(user).Error
}

// --- Metody Token (Naprawione) ---

func (r *GormUserRepository) GetTokenByUsosID(usosID string) (*models.Token, error) {
	var token models.Token
	// Zakładamy, że w modelu Token pole nazywa się UserUsosID, a w bazie user_usos_id
	if err := r.DB.Where("user_usos_id = ?", usosID).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}

// SaveToken - Naprawiona metoda używająca GORM zamiast raw SQL z pgx
func (r *GormUserRepository) SaveToken(token *models.Token) error {
	// Używamy klauzuli ON CONFLICT, aby wymusić aktualizację
	return r.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_usos_id"}},                                                           // Klucz główny w bazie
		DoUpdates: clause.AssignmentColumns([]string{"access_token", "access_token_secret", "scopes", "updated_at"}), // Pola do aktualizacji
	}).Create(token).Error
}

// --- Metody Przedmiotów (Subject) ---

func (r *GormUserRepository) FindOrCreateSubjectByUsosID(usosID, name string) (*models.Subject, error) {
	var subject models.Subject
	if err := r.DB.Where(models.Subject{UsosID: usosID}).FirstOrCreate(&subject, models.Subject{UsosID: usosID, Name: name}).Error; err != nil {
		return nil, err
	}
	return &subject, nil
}

func (r *GormUserRepository) GetSubjects() ([]models.Subject, error) {
	var subjects []models.Subject
	if err := r.DB.Find(&subjects).Error; err != nil {
		return nil, err
	}
	return subjects, nil
}

func (r *GormUserRepository) GetSubjectByUsosID(usosID string) (*models.Subject, error) {
	var subject models.Subject
	if err := r.DB.Where("usos_id = ?", usosID).First(&subject).Error; err != nil {
		return nil, err
	}
	return &subject, nil
}

// --- Metody Grafu i Tematów ---

func (r *GormUserRepository) GetTopicsBySubjectID(subjectID uint) ([]models.Topic, error) {
	var topics []models.Topic
	if err := r.DB.Where("subject_id = ?", subjectID).Find(&topics).Error; err != nil {
		return nil, err
	}
	return topics, nil
}

func (r *GormUserRepository) GetGraphByCourseUsosID(usosID string) ([]models.QuizNode, error) {
	var nodes []models.QuizNode
	if err := r.DB.Where("usos_course_id = ?", usosID).Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}

// --- Metody Tworzenia Treści ---

func (r *GormUserRepository) CreateTopic(topic *models.Topic) error {
	return r.DB.Create(topic).Error
}

func (r *GormUserRepository) CreateFlashcard(flashcard *models.Flashcard) error {
	return r.DB.Create(flashcard).Error
}

func (r *GormUserRepository) CreateQuizQuestion(question *models.QuizQuestion) error {
	return r.DB.Create(question).Error
}

func (r *GormUserRepository) CreateCalendarLayer(layer *models.CalendarLayer) error {
	return r.DB.Create(layer).Error
}

// --- Metody Moderacji ---

func (r *GormUserRepository) GetPendingFlashcards() ([]models.Flashcard, error) {
	var flashcards []models.Flashcard
	if err := r.DB.Where("status = ?", "pending").Find(&flashcards).Error; err != nil {
		return nil, err
	}
	return flashcards, nil
}

func (r *GormUserRepository) SetFlashcardStatus(id uint, status string) error {
	return r.DB.Model(&models.Flashcard{}).Where("id = ?", id).Update("status", status).Error
}

func (r *GormUserRepository) GetApprovedFlashcardsByTopic(topicID uint) ([]models.Flashcard, error) {
	var flashcards []models.Flashcard
	if err := r.DB.Where("topic_id = ? AND status = ?", topicID, "approved").Find(&flashcards).Error; err != nil {
		return nil, err
	}
	return flashcards, nil
}

func (r *GormUserRepository) GetApprovedQuizQuestionsByTopic(topicID uint) ([]models.QuizQuestion, error) {
	var questions []models.QuizQuestion
	if err := r.DB.Where("topic_id = ? AND status = ?", topicID, "approved").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

// --- Metody Grup ---

func (r *GormUserRepository) IsUserGroupLeader(userUsosID string, usosGroupID int) (bool, error) {
	var role models.UserGroupRole
	if err := r.DB.Where("user_usos_id = ? AND usos_group_id = ? AND role = ?", userUsosID, usosGroupID, "leader").First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
