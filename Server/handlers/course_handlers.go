package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/models"
	"github.com/skni-kod/InfQuizyTor/Server/services"
)

// HandleGetSubjects (Prosta) - tylko pobiera zsynchronizowane przedmioty
func HandleGetSubjects(c *gin.Context) {
	subjects, err := db.UserRepository.GetSubjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania przedmiotów"})
		return
	}
	if subjects == nil {
		subjects = []models.Subject{}
	}
	c.JSON(http.StatusOK, subjects)
}

// HandleSyncSubjects - Pobiera dane z USOS i zapisuje je w naszej bazie danych
func HandleSyncSubjects(c *gin.Context) {
	// 1. Pobierz userUsosID z sesji
	session := sessions.Default(c)
	userUsosIDValue := session.Get("user_usos_id")
	if userUsosIDValue == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Brak autoryzacji"})
		return
	}
	userUsosID := userUsosIDValue.(string)

	// 2. Wywołaj USOS API używając MakeSignedRequest
	usosPath := "courses/user"
	usosFields := "course_editions|terms"

	resp, err := services.UsosService.MakeSignedRequest(userUsosID, usosPath, usosFields)
	if err != nil {
		log.Printf("HandleSyncSubjects: Błąd z MakeSignedRequest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania kursów z USOS: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	// 3. Odczytaj i zdekoduj JSON
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd odczytu odpowiedzi USOS: " + err.Error()})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "Błąd serwera USOS", "details": string(bodyBytes)})
		return
	}

	var usosCourses models.UsosUserCoursesResponse
	if err := json.Unmarshal(bodyBytes, &usosCourses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd dekodowania odpowiedzi USOS: " + err.Error()})
		return
	}

	// 4. Synchronizuj kursy z naszą bazą danych (FindOrCreate)
	for _, termCourses := range usosCourses.CourseEditions {
		for _, course := range termCourses {
			// Użyj funkcji z db.go, aby znaleźć lub utworzyć wpis
			_, err := db.UserRepository.FindOrCreateSubjectByUsosID(course.CourseID, course.CourseName.PL)
			if err != nil {
				log.Printf("Błąd synchronizacji przedmiotu %s (ID: %s): %v", course.CourseName.PL, course.CourseID, err)
			}
		}
	}

	// 5. Zwróć sukces
	c.JSON(http.StatusOK, gin.H{"status": "synchronized"})
}

// HandleGetTopicsByUsosID pobiera odblokowane tematy (Topics) dla danego kursu
func HandleGetTopicsByUsosID(c *gin.Context) {
	usosID := c.Param("usos_id")

	// 1. Znajdź nasz wewnętrzny Subject.ID na podstawie usosID
	subject, err := db.UserRepository.GetSubjectByUsosID(usosID)
	if err != nil {
		log.Printf("Błąd HandleGetTopicsByUsosID: Nie znaleziono przedmiotu dla usosID: %s. Błąd: %v", usosID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Nie znaleziono przedmiotu w bazie danych. Spróbuj odświeżyć stronę."})
		return
	}

	// 2. Użyj Subject.ID (uint) do pobrania tematów
	topics, err := db.UserRepository.GetTopicsBySubjectID(subject.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania tematów"})
		return
	}

	if topics == nil {
		topics = []models.Topic{} // Zwróć pustą tablicę zamiast null
	}

	c.JSON(http.StatusOK, topics)
}

// HandleGetCourseGraph pobiera strukturę grafu (QuizNodes) dla danego kursu
func HandleGetCourseGraph(c *gin.Context) {
	usosID := c.Param("usos_id")

	// 1. Pobierz węzły (QuizNode) z bazy dla danego UsosCourseID
	nodes, err := db.UserRepository.GetGraphByCourseUsosID(usosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania grafu"})
		return
	}

	if nodes == nil {
		nodes = []models.QuizNode{} // Zwróć pustą tablicę zamiast null
	}

	c.JSON(http.StatusOK, nodes)
}
