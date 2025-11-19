package db

import (
	"errors"
	"log"
	"time"

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var UserRepository *GormUserRepository

type GormUserRepository struct {
	DB *gorm.DB
}

func InitDB(cfg config.Config) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Nie można połączyć się z bazą danych: %v", err)
	}

	log.Println("Uruchamianie automigracji bazy danych...")
	err = db.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.Subject{},
		&models.Topic{},
		&models.Flashcard{},
		&models.QuizQuestion{},
		&models.CalendarLayer{},
		&models.CalendarEvent{},
		&models.QuizNode{},
		// Nowe tabele
		&models.UserProgress{},
		&models.Achievement{},
		&models.UserAchievement{},
	)
	if err != nil {
		log.Fatalf("Błąd automigracji: %v", err)
	}

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

// --- Metody User/Token ---

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

func (r *GormUserRepository) GetTokenByUsosID(usosID string) (*models.Token, error) {
	var token models.Token
	if err := r.DB.Where("user_usos_id = ?", usosID).First(&token).Error; err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *GormUserRepository) SaveToken(token *models.Token) error {
	return r.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_usos_id"}},
		UpdateAll: true,
	}).Create(token).Error
}

// --- Metody Dashboard ---

func (r *GormUserRepository) GetLastUserProgress(userUsosID string) (*models.UserProgress, error) {
	var progress models.UserProgress
	err := r.DB.Preload("Topic.Subject").
		Where("user_usos_id = ?", userUsosID).
		Order("updated_at desc").
		First(&progress).Error

	if err != nil {
		// Jeśli po prostu nie znaleziono rekordu, zwróć nil (bez błędu)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &progress, nil
}

func (r *GormUserRepository) GetUserAchievements(userUsosID string) ([]models.UserAchievement, error) {
	var achievements []models.UserAchievement
	if err := r.DB.Preload("Achievement").
		Where("user_usos_id = ?", userUsosID).
		Order("unlocked_at desc").
		Find(&achievements).Error; err != nil {
		return nil, err
	}
	return achievements, nil
}

// --- Metody Przedmiotów ---
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

// --- Metody Tworzenia ---
func (r *GormUserRepository) CreateTopic(topic *models.Topic) error { return r.DB.Create(topic).Error }
func (r *GormUserRepository) CreateFlashcard(fc *models.Flashcard) error {
	return r.DB.Create(fc).Error
}
func (r *GormUserRepository) CreateQuizQuestion(q *models.QuizQuestion) error {
	return r.DB.Create(q).Error
} // --- Metody Kalendarza ---

// GetLayersByUsosID pobiera warstwy prywatne użytkownika ORAZ wszystkie warstwy grupowe
func (r *GormUserRepository) GetLayersByUsosID(userUsosID string) ([]models.CalendarLayer, error) {
	var layers []models.CalendarLayer
	// Pobierz warstwy prywatne użytkownika i wszystkie warstwy grupowe (uproszczone założenie dostępu)
	// Aby uniknąć problemów z Joinami, na razie pobieramy prywatne i grupowe dla demo.
	if err := r.DB.Where("owner_usos_id = ?", userUsosID).Or("type = ?", "group").Find(&layers).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.CalendarLayer{}, nil
		}
		return nil, err
	}
	return layers, nil
}

// GetEventsByLayerIDs pobiera wydarzenia dla danych warstw i zakresu dat
func (r *GormUserRepository) GetEventsByLayerIDs(layerIDs []uint, start, end time.Time) ([]models.CalendarEvent, error) {
	var events []models.CalendarEvent

	// Zabezpieczenie przed pustą listą ID
	if len(layerIDs) == 0 {
		return []models.CalendarEvent{}, nil
	}

	// Filtrowanie po ID warstw ORAZ datach
	query := r.DB.Where("layer_id IN (?)", layerIDs).
		Where("start_time >= ?", start).
		Where("start_time < ?", end).
		Order("start_time ASC") // Dodano sortowanie dla porządku

	if err := query.Find(&events).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.CalendarEvent{}, nil
		}
		return nil, err
	}
	return events, nil
}
func (r *GormUserRepository) CreateCalendarLayer(l *models.CalendarLayer) error {
	return r.DB.Create(l).Error
}

// --- Metody Moderacji ---
func (r *GormUserRepository) GetPendingFlashcards() ([]models.Flashcard, error) {
	var f []models.Flashcard
	if err := r.DB.Where("status = ?", "pending").Find(&f).Error; err != nil {
		return nil, err
	}
	return f, nil
}
func (r *GormUserRepository) SetFlashcardStatus(id uint, status string) error {
	return r.DB.Model(&models.Flashcard{}).Where("id = ?", id).Update("status", status).Error
}
func (r *GormUserRepository) GetApprovedFlashcardsByTopic(topicID uint) ([]models.Flashcard, error) {
	var f []models.Flashcard
	if err := r.DB.Where("topic_id = ? AND status = ?", topicID, "approved").Find(&f).Error; err != nil {
		return nil, err
	}
	return f, nil
}
func (r *GormUserRepository) GetApprovedQuizQuestionsByTopic(topicID uint) ([]models.QuizQuestion, error) {
	var q []models.QuizQuestion
	if err := r.DB.Where("topic_id = ? AND status = ?", topicID, "approved").Find(&q).Error; err != nil {
		return nil, err
	}
	return q, nil
}
