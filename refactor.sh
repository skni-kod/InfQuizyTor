#!/bin/bash
#
# SKRYPT REFAKTORYZUJĄCY TYLKO BACKEND (Server -> backend)
#
# Przenosi pliki z `Server/` do profesjonalnej struktury Clean Architecture.
# Upewnij się, że ewentualny `mockServer.js` jest zatrzymany.
#

set -e # Przerwij skrypt, jeśli jakakolwiek komenda zawiedzie

# --- Definicje Kolorów i Stylów ---
BOLD_GREEN="\033[1;32m"
BOLD_YELLOW="\033[1;33m"
BOLD_CYAN="\033[1;36m"
BOLD_WHITE="\033[1;37m"
DIM_GRAY="\033[2;37m"
RESET="\033[0m"

# --- Funkcje Pomocnicze ---
log_header() { echo -e "\n${BOLD_CYAN}=======================================================${RESET}"; }
log_info() { echo -e "${BOLD_WHITE}ℹ $1${RESET}"; }
log_warn() { echo -e "${BOLD_YELLOW}⚠️  $1${RESET}"; }
log_success() { echo -e "${BOLD_GREEN}✅ $1${RESET}"; }

ensure_dir() {
    mkdir -p "$1"
}

move_item() {
    local src="$1"
    local dest="$2"
    if [ ! -e "$src" ]; then
        log_warn "Oczekiwano '$src', ale nie znaleziono. Pomijam."
    else
        ensure_dir "$(dirname "$2")"
        echo -e "${DIM_GRAY}    -> Przenoszę '$src' do '$2'${RESET}"
        mv "$src" "$2"
    fi
}

rmdir_safe() {
    rmdir "$1" 2>/dev/null || log_warn "Katalog '$1' nie jest pusty (może zawierać ukryte pliki) lub nie istnieje. Pomijam usuwanie."
}

rm_safe() {
    rm -f "$1" 2>/dev/null || true
}

# === REFAKTORYZACJA BACKENDU (Clean Architecture) ===
refactor_backend() {
    log_header
    log_info "Rozpoczynam refaktoryzację Backendu (Server -> backend)"
    log_header

    if [ ! -d "Server" ]; then
        log_warn "Katalog 'Server' nie znaleziony. Pomijam backend."
        return
    fi

    log_info "Krok 1/4: Zmiana nazwy 'Server' -> 'backend' i tworzenie struktury"
    move_item "Server" "backend"
    
    # Tworzenie nowej, logicznej struktury katalogów
    ensure_dir "backend/cmd/api"
    ensure_dir "backend/internal/api"
    ensure_dir "backend/internal/auth"
    ensure_dir "backend/internal/config"
    ensure_dir "backend/internal/database"
    ensure_dir "backend/internal/domain"
    ensure_dir "backend/internal/proxy"
    ensure_dir "backend/internal/user"
    ensure_dir "backend/migrations"
    ensure_dir "backend/pkg/usos"
    ensure_dir "backend/docs"

    log_info "Krok 2/4: Migracja plików do nowej struktury"
    
    # cmd (Entrypoint)
    move_item "backend/cmd/main.go" "backend/cmd/api/main.go"
    # Usuwamy stary main.go z roota (teraz jest w cmd/api)
    rm_safe "backend/main.go"
    
    # internal/config
    move_item "backend/config/config.go" "backend/internal/config/config.go"
    
    # internal/database (Połączenie)
    move_item "backend/db/db.go" "backend/internal/database/postgres.go"
    
    # internal/domain (Model)
    move_item "backend/models/token.go" "backend/internal/domain/token.go"
    
    # internal/user (Repozytorium i Handler)
    move_item "backend/db/token_store.go" "backend/internal/user/repository.go"
    move_item "backend/handlers/user_handlers.go" "backend/internal/user/handler.go"
    
    # internal/auth (Handler)
    move_item "backend/handlers/auth_handlers.go" "backend/internal/auth/handler.go"

    # internal/proxy (Handler)
    move_item "backend/handlers/proxy_handlers.go" "backend/internal/proxy/handler.go"
    
    # internal/api (Middleware)
    move_item "backend/middleware/auth_middleware.go" "backend/internal/api/middleware.go"
    
    # pkg/usos (Logika OAuth i klienta)
    move_item "backend/services/usos_service.go" "backend/pkg/usos/client.go"
    
    # migrations
    move_item "backend/init.sql" "backend/migrations/001_init_tokens.sql"
    
    # docs
    move_item "backend/struktura.md" "backend/docs/struktura.md"

    log_info "Krok 3/4: Czyszczenie starych katalogów..."
    rmdir_safe "backend/cmd"
    rmdir_safe "backend/config"
    rmdir_safe "backend/db"
    rmdir_safe "backend/handlers"
    rmdir_safe "backend/middleware"
    rmdir_safe "backend/models"
    rmdir_safe "backend/services"

    log_info "Krok 4/4: Aktualizacja go.mod..."
    sed -i.bak 's|github.com/skni-kod/InfQuizyTor/Server|github.com/skni-kod/InfQuizyTor/backend|g' backend/go.mod
    rm_safe "backend/go.mod.bak" # Usuń plik kopii zapasowej

    log_success "Refaktoryzacja Backendu zakończona."
}

# --- GŁÓWNA FUNKCJA WYKONAWCZA ---
main() {
    log_header
    log_info "Rozpoczynam refaktoryzację struktury TYLKO DLA BACKENDU."
    log_warn "Upewnij się, że serwer deweloperski (npm run dev) LUB mockServer (node mockServer.js) jest ZATRZYMANY!"
    log_header

    # Wykonaj refaktoryzację
    refactor_backend

    # --- Końcowe ostrzeżenie ---
    log_header
    echo -e "${BOLD_GREEN}Pliki backendu zostały przeniesione do nowej struktury!${RESET}"
    log_header
    echo -e "${BOLD_YELLOW}KRYTYCZNE NASTĘPNE KROKI:${RESET}"
    echo -e "${BOLD_WHITE}1. Backend ${BOLD_YELLOW}NIE ZADZIAŁA${RESET} ${BOLD_WHITE}bez aktualizacji importów.${RESET}"
    echo -e "${BOLD_WHITE}2. Otwórz 'backend/go.mod' i uruchom 'go mod tidy' w terminalu."
    echo -e "${BOLD_WHITE}3. Otwórz folder 'backend' w edytorze kodu (np. VS Code)."
    echo -e "${BOLD_WHITE}4. Popraw wszystkie błędy importu w plikach .go (szczególnie w 'backend/cmd/api/main.go')."
    echo -e "${BOLD_YELLOW}Powodzenia!${RESET}"
}

# Uruchom główną funkcję
main