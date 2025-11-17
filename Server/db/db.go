package db

import (
	"log"

	"github.com/skni-kod/InfQuizyTor/Server/config"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
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
	// --- POPRAWKA: Dodajemy nowe modele do AutoMigrate ---
	err = db.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.Subject{},
		&models.Topic{},
		&models.Flashcard{},
		&models.QuizQuestion{},
		// &models.UserGroupRole{}, // Możesz dodać później
		// &models.CalendarLayer{}, // Możesz dodać później
		// &models.CalendarEvent{}, // Możesz dodać później
	)
	if err != nil {
		log.Fatalf("Błąd automigracji: %v", err)
	}
	// --- KONIEC POPRAWKI ---

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

// --- Metody User/Token (bez zmian) ---

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

// --- NOWE METODY DLA NOWEJ LOGIKI ---

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

func (r *GormUserRepository) GetTopicsBySubjectID(subjectID uint) ([]models.Topic, error) {
	var topics []models.Topic
	if err := r.DB.Where("subject_id = ?", subjectID).Find(&topics).Error; err != nil {
		return nil, err
	}
	return topics, nil
}

func (r *GormUserRepository) CreateTopic(topic *models.Topic) error {
	return r.DB.Create(topic).Error
}

func (r *GormUserRepository) CreateFlashcard(flashcard *models.Flashcard) error {
	return r.DB.Create(flashcard).Error
}

func (r *GormUserRepository) CreateQuizQuestion(question *models.QuizQuestion) error {
	return r.DB.Create(question).Error
}

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

// (Dodałem resztę funkcji CRUD dla QuizQuestion)
func (r *GormUserRepository) GetPendingQuizQuestions() ([]models.QuizQuestion, error) {
	var questions []models.QuizQuestion
	if err := r.DB.Where("status = ?", "pending").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *GormUserRepository) SetQuizQuestionStatus(id uint, status string) error {
	return r.DB.Model(&models.QuizQuestion{}).Where("id = ?", id).Update("status", status).Error
}

func (r *GormUserRepository) GetApprovedQuizQuestionsByTopic(topicID uint) ([]models.QuizQuestion, error) {
	var questions []models.QuizQuestion
	if err := r.DB.Where("topic_id = ? AND status = ?", topicID, "approved").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}
