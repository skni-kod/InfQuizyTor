package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/skni-kod/InfQuizyTor/Server/db"
	"github.com/skni-kod/InfQuizyTor/Server/services"
	"github.com/skni-kod/InfQuizyTor/Server/utils"
)

// HandleGetSubjects synchronizuje USOS z lokalną DB i zwraca listę przedmiotów
func HandleGetSubjects(c *gin.Context) {
	userUsosIDValue, _ := c.Get("user_usos_id")
	userUsosID := userUsosIDValue.(string)

	// 1. Pobierz kursy z USOS API
	usosCourses, err := services.UsosService.GetCourses(userUsosID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania kursów z USOS: "+err.Error())
		return
	}

	// 2. Synchronizuj z lokalną bazą danych
	syncedSubjects := make(map[string]bool)

	for _, editions := range usosCourses.CourseEditions {
		for _, course := range editions {
			if _, exists := syncedSubjects[course.CourseID]; !exists {
				courseName := course.CourseName.PL
				if courseName == "" {
					courseName = course.CourseName.EN
				}

				_, err := db.UserRepository.FindOrCreateSubjectByUsosID(course.CourseID, courseName)
				if err != nil {
					log.Printf("Błąd synchronizacji przedmiotu %s: %v", course.CourseID, err)
				}
				syncedSubjects[course.CourseID] = true
			}
		}
	}

	// 3. Pobierz WSZYSTKIE przedmioty z naszej bazy
	subjects, err := db.UserRepository.GetSubjects()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania przedmiotów z bazy danych: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, subjects)
}

// HandleGetTopics zwraca tematy dla konkretnego przedmiotu
func HandleGetTopics(c *gin.Context) {
	subjectIDParam := c.Param("id")
	subjectID, err := strconv.ParseUint(subjectIDParam, 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Nieprawidłowe ID przedmiotu")
		return
	}

	topics, err := db.UserRepository.GetTopicsBySubjectID(uint(subjectID))
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Błąd pobierania tematów: "+err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, topics)
}
