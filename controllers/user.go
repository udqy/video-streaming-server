package controllers

import (
	"log"
	"net/http"
	"time"

	"encoding/json"
	"video-streaming-server/services"
	"video-streaming-server/utils"

	"github.com/go-playground/validator"
)

type RegisterRequest struct {
	Username        string `json:"username" validate:"required,min=3,max=32"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=Password"`
}

type RegisterResponse struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

func RegisterUser(w http.ResponseWriter, r *http.Request, userService services.UserService) {
	var requestBody RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		log.Println(err)
		utils.SendError(w, http.StatusBadRequest, "Invalid Request Body")
		return
	}

	validate := validator.New()
	err = validate.Struct(requestBody)
	if err != nil {
		log.Println(err)
		utils.SendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	newUser, err := userService.RegisterUser(requestBody.Username, requestBody.Email, requestBody.Password)
	if err != nil {
		switch err.Error() {
		case "email already exists":
			utils.SendError(w, http.StatusConflict, "Email already exists")
		case "username already exists":
			utils.SendError(w, http.StatusConflict, "Username already taken")
		default:
			log.Fatal(err)
			utils.SendError(w, http.StatusInternalServerError, "Internal server error")
		}

		return
	}

	response := RegisterResponse{
		ID:        newUser.ID,
		Username:  newUser.Username,
		Email:     newUser.Email,
		CreatedAt: newUser.CreatedAt,
	}

	jsonResponse, err := json.Marshal(response)

	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write(jsonResponse)
}

func LoginUser(w http.ResponseWriter, r *http.Request, userService services.UserService) {
	var requestBody LoginRequest

	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		log.Println(err)
		utils.SendError(w, http.StatusBadRequest, "Invalid Request Body")
		return
	}

	validate := validator.New()
	err = validate.Struct(requestBody)
	if err != nil {
		log.Println(err)
		utils.SendError(w, http.StatusBadRequest, "Invalid Request Body")
		return
	}

	user, err := userService.AuthenticateUser(requestBody.Email, requestBody.Password)
	if err != nil {
		switch err.Error() {
		case "invalid credentials":
			utils.SendError(w, http.StatusUnauthorized, "Invalid email or password")
		case "user does not exist":
			utils.SendError(w, http.StatusNotFound, "User does not exist")
		default:
			utils.SendError(w, http.StatusInternalServerError, "Internal server error")
		}
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Username)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Set the JWT token in the response
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   86400, // 24 hours
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Logged in successfully"}`))
}
