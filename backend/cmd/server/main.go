package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	openai "github.com/sashabaranov/go-openai"
	// httpSwagger "github.com/swaggo/http-swagger"
	_ "github.com/Tsebo200/SkyRecommendsGames/backend/cmd/server/docs" // Import generated docs
)

// Application configuration sourced from environment
type AppConfig struct {
	Port         string
	RawgAPIKey   string
	SupabaseURL  string
	SupabaseAnon string
	OpenAIKey    string
	SteamAPIKey  string
}

func loadDotEnv() {
	// Try common locations so running from backend/ still picks up repo root .env
	candidates := []string{
		".env",          // current dir
		"../.env",       // parent (e.g., running from backend/)
		"../../.env",    // grandparent
		"../../../.env", // fallback if structure changes
	}
	for _, p := range candidates {
		if err := godotenv.Load(p); err == nil {
			return
		}
	}
}

// Request payload for game upsert
type upsertGameRequest struct {
	Slug      string            `json:"slug"`
	Name      string            `json:"name"`
	Platforms []string          `json:"platforms"`
	Genres    []string          `json:"genres"`
	StoreURLs map[string]string `json:"store_urls"`
	Rubric    map[string]any    `json:"rubric"`
	Embedding []float32         `json:"embedding"`
}

// RPC payload mapped to Supabase function args
type rpcUpsertPayload struct {
	Slug      string    `json:"p_slug"`
	Name      string    `json:"p_name"`
	Platforms []string  `json:"p_platforms"`
	Genres    []string  `json:"p_genres"`
	StoreURLs any       `json:"p_store_urls"`
	Rubric    any       `json:"p_rubric"`
	Embedding []float32 `json:"p_embedding"`
}

// In-memory state for rate limiting and response caching
type AppState struct {
	// Rate limiter used by RAWG proxy endpoint
	rawgLimiter *rateLimiter
	// Small TTL cache for RAWG search responses
	rawgCache *rawgCache
}

// Sliding window rate limiter keyed by client identifier
type rateLimiter struct {
	mu      sync.Mutex
	hits    map[string][]time.Time
	maxHits int
	window  time.Duration
}

func newRateLimiter(maxHits int, window time.Duration) *rateLimiter {
	return &rateLimiter{hits: make(map[string][]time.Time), maxHits: maxHits, window: window}
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	windowStart := now.Add(-rl.window)
	ts := rl.hits[key]
	// drop old timestamps in-place
	j := 0
	for _, t := range ts {
		if t.After(windowStart) {
			ts[j] = t
			j++
		}
	}
	ts = ts[:j]
	if len(ts) >= rl.maxHits {
		rl.hits[key] = ts
		return false
	}
	rl.hits[key] = append(ts, now)
	return true
}

// Cached HTTP response with TTL
type cachedResponse struct {
	status int
	body   []byte
	expire time.Time
}

// Simple FIFO TTL cache for RAWG search
type rawgCache struct {
	mu   sync.Mutex
	m    map[string]cachedResponse
	ttl  time.Duration
	cap  int
	keys []string
}

func newRawgCache(ttl time.Duration, cap int) *rawgCache {
	return &rawgCache{m: make(map[string]cachedResponse), ttl: ttl, cap: cap}
}

func (c *rawgCache) get(key string) (cachedResponse, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	v, ok := c.m[key]
	if !ok || time.Now().After(v.expire) {
		if ok {
			delete(c.m, key)
		}
		return cachedResponse{}, false
	}
	return v, true
}

func (c *rawgCache) set(key string, status int, body []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.m) >= c.cap {
		// evict oldest
		if len(c.keys) > 0 {
			old := c.keys[0]
			c.keys = c.keys[1:]
			delete(c.m, old)
		}
	}
	c.keys = append(c.keys, key)
	c.m[key] = cachedResponse{status: status, body: body, expire: time.Now().Add(c.ttl)}
}

func mustLoadConfig() AppConfig {
	loadDotEnv()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	rawg := os.Getenv("RAWG_API_KEY")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnon := os.Getenv("SUPABASE_ANON_KEY")
	openAIKey := os.Getenv("OPENAI_API_KEY")
	steamAPIKey := os.Getenv("STEAM_API_KEY")
	return AppConfig{Port: port, RawgAPIKey: rawg, SupabaseURL: supabaseURL, SupabaseAnon: supabaseAnon, OpenAIKey: openAIKey, SteamAPIKey: steamAPIKey}
}

func clientIP(r *http.Request) string {
	// Prefer X-Forwarded-For when behind proxy
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	h, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return h
}

// CORS middleware (development defaults)
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg := mustLoadConfig()
	if cfg.RawgAPIKey == "" {
		log.Println("warning: RAWG_API_KEY is not set; RAWG proxy will be limited or fail")
	}
	if cfg.SupabaseURL == "" || cfg.SupabaseAnon == "" {
		log.Println("warning: SUPABASE_URL or SUPABASE_ANON_KEY not set; RPC calls will fail")
	}
	if cfg.OpenAIKey == "" {
		log.Println("info: OPENAI_API_KEY not set; upsert will require embedding provided by client")
	}

	state := &AppState{
		rawgLimiter: newRateLimiter(5, 2*time.Second),  // 5 requests / 2s per IP
		rawgCache:   newRawgCache(30*time.Second, 256), // 30s TTL cache for identical queries
	}

	// Router & core middleware
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors)

	// Serve OpenAPI spec and basic Swagger UI
	r.Get("/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/x-yaml")
		http.ServeFile(w, r, "openapi.yaml")
	})

	r.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "swagger-ui.html")
	})

	// Health endpoint
	// @Summary Health check
	// @Description Returns server health status
	// @Tags health
	// @Accept json
	// @Produce json
	// @Success 200 {object} map[string]string
	// @Router /health [get]
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Steam API endpoints
	r.Get("/steam/player/{steamId}", func(w http.ResponseWriter, r *http.Request) {
		steamId := chi.URLParam(r, "steamId")
		if steamId == "" {
			http.Error(w, "Steam ID required", http.StatusBadRequest)
			return
		}

		url := fmt.Sprintf("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s", cfg.SteamAPIKey, steamId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch Steam data", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read Steam response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/steam/games/{steamId}", func(w http.ResponseWriter, r *http.Request) {
		steamId := chi.URLParam(r, "steamId")
		if steamId == "" {
			http.Error(w, "Steam ID required", http.StatusBadRequest)
			return
		}

		url := fmt.Sprintf("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&include_played_free_games=true&include_appinfo=true&format=json", cfg.SteamAPIKey, steamId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch Steam games", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read Steam response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/steam/recommendations/{steamId}", func(w http.ResponseWriter, r *http.Request) {
		steamId := chi.URLParam(r, "steamId")
		if steamId == "" {
			http.Error(w, "Steam ID required", http.StatusBadRequest)
			return
		}

		// Get user's games and profile data
		gamesUrl := fmt.Sprintf("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&include_played_free_games=true&include_appinfo=true&format=json", cfg.SteamAPIKey, steamId)
		profileUrl := fmt.Sprintf("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s", cfg.SteamAPIKey, steamId)

		// Fetch games data
		gamesResp, err := http.Get(gamesUrl)
		if err != nil {
			http.Error(w, "Failed to fetch Steam games for recommendations", http.StatusInternalServerError)
			return
		}
		defer gamesResp.Body.Close()

		gamesBody, err := io.ReadAll(gamesResp.Body)
		if err != nil {
			http.Error(w, "Failed to read Steam games response", http.StatusInternalServerError)
			return
		}

		// Fetch profile data
		profileResp, err := http.Get(profileUrl)
		if err != nil {
			http.Error(w, "Failed to fetch Steam profile for recommendations", http.StatusInternalServerError)
			return
		}
		defer profileResp.Body.Close()

		profileBody, err := io.ReadAll(profileResp.Body)
		if err != nil {
			http.Error(w, "Failed to read Steam profile response", http.StatusInternalServerError)
			return
		}

		// Parse the responses
		var gamesData map[string]interface{}
		var profileData map[string]interface{}

		if err := json.Unmarshal(gamesBody, &gamesData); err != nil {
			http.Error(w, "Failed to parse Steam games data", http.StatusInternalServerError)
			return
		}

		if err := json.Unmarshal(profileBody, &profileData); err != nil {
			http.Error(w, "Failed to parse Steam profile data", http.StatusInternalServerError)
			return
		}

		// Generate AI-powered recommendations using OpenAI
		recommendations := generateSteamRecommendations(gamesData, profileData, cfg.OpenAIKey)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(recommendations)
	})

	// Steam Pattern Recommendations endpoint
	r.Post("/steam/pattern-recommendations", func(w http.ResponseWriter, r *http.Request) {
		var analysisRequest struct {
			SteamId       string `json:"steamId"`
			PlayerName    string `json:"playerName"`
			TotalGames    int    `json:"totalGames"`
			TotalPlaytime int    `json:"totalPlaytime"`
			TopGames      []struct {
				Name           string `json:"name"`
				Playtime       int    `json:"playtime"`
				RecentPlaytime int    `json:"recentPlaytime"`
			} `json:"topGames"`
			RecentGames []struct {
				Name           string `json:"name"`
				Playtime       int    `json:"playtime"`
				RecentPlaytime int    `json:"recentPlaytime"`
			} `json:"recentGames"`
		}

		if err := json.NewDecoder(r.Body).Decode(&analysisRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Generate pattern-based recommendations
		recommendations := generatePatternBasedRecommendations(analysisRequest, cfg.OpenAIKey)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(recommendations)
	})

	// Steam AI Analysis endpoint
	r.Post("/steam/ai-analysis", func(w http.ResponseWriter, r *http.Request) {
		var analysisRequest struct {
			SteamId       string `json:"steamId"`
			PlayerName    string `json:"playerName"`
			TotalGames    int    `json:"totalGames"`
			TotalPlaytime int    `json:"totalPlaytime"`
			Games         []struct {
				Name           string `json:"name"`
				Playtime       int    `json:"playtime"`
				RecentPlaytime int    `json:"recentPlaytime"`
				Appid          int    `json:"appid"`
			} `json:"games"`
		}

		if err := json.NewDecoder(r.Body).Decode(&analysisRequest); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Generate comprehensive AI analysis
		analysis := generateComprehensiveSteamAnalysis(analysisRequest, cfg.OpenAIKey)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(analysis)
	})

	// PlayStation API endpoints
	r.Get("/playstation/profile/{psnId}", func(w http.ResponseWriter, r *http.Request) {
		psnId := chi.URLParam(r, "psnId")
		if psnId == "" {
			http.Error(w, "PSN ID required", http.StatusBadRequest)
			return
		}

		// PlayStation API endpoint for profile
		url := fmt.Sprintf("https://m.np.playstation.com/api/userProfile/v1/internal/users/%s/profiles", psnId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch PlayStation profile", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read PlayStation response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/playstation/games/{psnId}", func(w http.ResponseWriter, r *http.Request) {
		psnId := chi.URLParam(r, "psnId")
		if psnId == "" {
			http.Error(w, "PSN ID required", http.StatusBadRequest)
			return
		}

		// PlayStation API endpoint for games
		url := fmt.Sprintf("https://m.np.playstation.com/api/gamelist/v2/users/%s/titles", psnId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch PlayStation games", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read PlayStation response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/playstation/trophies/{psnId}", func(w http.ResponseWriter, r *http.Request) {
		psnId := chi.URLParam(r, "psnId")
		if psnId == "" {
			http.Error(w, "PSN ID required", http.StatusBadRequest)
			return
		}

		// PlayStation API endpoint for trophies
		url := fmt.Sprintf("https://m.np.playstation.com/api/trophy/v1/users/%s/trophySummary", psnId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch PlayStation trophies", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read PlayStation response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	// Xbox API endpoints
	r.Get("/xbox/profile/{gamertag}", func(w http.ResponseWriter, r *http.Request) {
		gamertag := chi.URLParam(r, "gamertag")
		if gamertag == "" {
			http.Error(w, "Gamertag required", http.StatusBadRequest)
			return
		}

		// Xbox API endpoint for profile
		url := fmt.Sprintf("https://xbl.io/api/v2/account/%s", gamertag)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch Xbox profile", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read Xbox response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/xbox/games/{gamertag}", func(w http.ResponseWriter, r *http.Request) {
		gamertag := chi.URLParam(r, "gamertag")
		if gamertag == "" {
			http.Error(w, "Gamertag required", http.StatusBadRequest)
			return
		}

		// Xbox API endpoint for games
		url := fmt.Sprintf("https://xbl.io/api/v2/games/%s", gamertag)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch Xbox games", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read Xbox response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	r.Get("/xbox/achievements/{gamertag}/{gameId}", func(w http.ResponseWriter, r *http.Request) {
		gamertag := chi.URLParam(r, "gamertag")
		gameId := chi.URLParam(r, "gameId")
		if gamertag == "" || gameId == "" {
			http.Error(w, "Gamertag and Game ID required", http.StatusBadRequest)
			return
		}

		// Xbox API endpoint for achievements
		url := fmt.Sprintf("https://xbl.io/api/v2/achievements/%s/%s", gamertag, gameId)
		resp, err := http.Get(url)
		if err != nil {
			http.Error(w, "Failed to fetch Xbox achievements", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, "Failed to read Xbox response", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	})

	// RAWG search proxy with rate limiting + caching
	// @Summary Search RAWG for games
	// @Description Proxies search requests to RAWG API with rate limiting and caching
	// @Tags rawg
	// @Accept json
	// @Produce json
	// @Param q query string true "Search query string"
	// @Success 200 {object} map[string]interface{}
	// @Failure 400 {string} string "Missing query parameter"
	// @Failure 429 {string} string "Rate limit exceeded"
	// @Failure 502 {string} string "Upstream error"
	// @Router /rawg/search [get]
	r.Get("/rawg/search", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if len(query) < 2 { // basic validation + helps debounce
			http.Error(w, "missing q", http.StatusBadRequest)
			return
		}
		ip := clientIP(r)
		if !state.rawgLimiter.allow("rawg:" + ip) {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		cacheKey := strings.ToLower(strings.TrimSpace(query))
		if v, ok := state.rawgCache.get(cacheKey); ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(v.status)
			_, _ = w.Write(v.body)
			return
		}
		apiURL := "https://api.rawg.io/api/games?search=" + urlQueryEscape(query) + "&key=" + urlQueryEscape(cfg.RawgAPIKey)
		fmt.Printf("🔍 RAWG API URL: %s\n", apiURL)
		fmt.Printf("🔍 RAWG API Key configured: %t\n", cfg.RawgAPIKey != "")
		resp, err := http.Get(apiURL)
		if err != nil {
			http.Error(w, "upstream error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		buf := new(bytes.Buffer)
		_, _ = io.Copy(buf, resp.Body)
		state.rawgCache.set(cacheKey, resp.StatusCode, buf.Bytes())
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		_, _ = w.Write(buf.Bytes())
	})

	// Get full game details by slug from RAWG API (includes description)
	// See: https://api.rawg.io/docs/#operation/games_read
	r.Get("/rawg/game", func(w http.ResponseWriter, r *http.Request) {
		slug := r.URL.Query().Get("slug")
		if slug == "" {
			http.Error(w, "slug parameter required", http.StatusBadRequest)
			return
		}

		// Fetch full game details from RAWG API
		apiURL := "https://api.rawg.io/api/games/" + urlQueryEscape(slug) + "?key=" + urlQueryEscape(cfg.RawgAPIKey)
		fmt.Printf("🔍 RAWG API URL (full game details): %s\n", apiURL)

		resp, err := http.Get(apiURL)
		if err != nil {
			http.Error(w, "upstream error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		buf := new(bytes.Buffer)
		_, _ = io.Copy(buf, resp.Body)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		_, _ = w.Write(buf.Bytes())
	})

	// Upsert game via Supabase RPC; generates embedding if not provided and OPENAI_API_KEY is set
	r.Post("/games/upsert", func(w http.ResponseWriter, r *http.Request) {
		var req upsertGameRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		if req.Slug == "" || req.Name == "" {
			http.Error(w, "slug and name are required", http.StatusBadRequest)
			return
		}
		if len(req.Embedding) > 0 && len(req.Embedding) != 1536 {
			http.Error(w, "embedding must be 1536 floats", http.StatusBadRequest)
			return
		}
		// If no embedding provided, try to generate from name + genres using gpt-3.5-turbo
		if len(req.Embedding) == 0 && cfg.OpenAIKey != "" {
			client := openai.NewClient(cfg.OpenAIKey)
			text := req.Name
			if len(req.Genres) > 0 {
				text = text + " | genres: " + strings.Join(req.Genres, ", ")
			}

			// Use gpt-3.5-turbo for text generation to create a description, then convert to embedding
			completionResp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
				Model: "gpt-3.5-turbo",
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    "system",
						Content: "You are a game recommendation AI. Generate a brief, descriptive text about this game that captures its essence, genre, and appeal. Keep it concise but informative.",
					},
					{
						Role:    "user",
						Content: fmt.Sprintf("Game: %s", text),
					},
				},
				MaxTokens: 100,
			})

			if err != nil {
				http.Error(w, "failed to generate game description with gpt-3.5-turbo", http.StatusBadGateway)
				return
			}

			// Now use the description to create an embedding
			description := completionResp.Choices[0].Message.Content
			embeddingResp, err := client.CreateEmbeddings(r.Context(), openai.EmbeddingRequest{
				Input: []string{description},
				Model: openai.AdaEmbeddingV2, // Still use Ada for embeddings
			})

			if err != nil || len(embeddingResp.Data) == 0 {
				http.Error(w, "failed to generate embedding from gpt-3.5-turbo description", http.StatusBadGateway)
				return
			}

			vec := make([]float32, len(embeddingResp.Data[0].Embedding))
			copy(vec, embeddingResp.Data[0].Embedding)
			req.Embedding = vec
		}
		payload := rpcUpsertPayload{
			Slug:      req.Slug,
			Name:      req.Name,
			Platforms: req.Platforms,
			Genres:    req.Genres,
			StoreURLs: req.StoreURLs,
			Rubric:    req.Rubric,
			Embedding: req.Embedding,
		}
		b, _ := json.Marshal(payload)
		endpoint := cfg.SupabaseURL + "/rest/v1/rpc/rpc_upsert_game"
		httpReq, _ := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(b))
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("apikey", cfg.SupabaseAnon)
		httpReq.Header.Set("Authorization", "Bearer "+cfg.SupabaseAnon)
		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			http.Error(w, "rpc error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	// Similar games via vector similarity RPC
	r.Get("/games/similar", func(w http.ResponseWriter, r *http.Request) {
		embeddingParam := r.URL.Query().Get("embedding")
		if embeddingParam == "" {
			http.Error(w, "missing embedding parameter", http.StatusBadRequest)
			return
		}
		limitParam := r.URL.Query().Get("limit")
		if limitParam == "" {
			limitParam = "10"
		}
		// Parse embedding array from query param (comma-separated floats)
		var embedding []float32
		parts := strings.Split(embeddingParam, ",")
		for _, part := range parts {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}
			var f float32
			if _, err := fmt.Sscanf(part, "%f", &f); err != nil {
				http.Error(w, "invalid embedding format", http.StatusBadRequest)
				return
			}
			embedding = append(embedding, f)
		}
		if len(embedding) == 0 {
			http.Error(w, "empty embedding", http.StatusBadRequest)
			return
		}
		limit, _ := strconv.Atoi(limitParam)
		payload := map[string]any{
			"p_user_embedding": embedding,
			"p_limit":          limit,
		}
		b, _ := json.Marshal(payload)
		endpoint := cfg.SupabaseURL + "/rest/v1/rpc/rpc_similar_games"
		httpReq, _ := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(b))
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("apikey", cfg.SupabaseAnon)
		httpReq.Header.Set("Authorization", "Bearer "+cfg.SupabaseAnon)
		resp, err := http.DefaultClient.Do(httpReq)
		if err != nil {
			http.Error(w, "rpc error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	// New endpoint: Generate recommendations using gpt-3.5-turbo
	r.Get("/games/recommendations", func(w http.ResponseWriter, r *http.Request) {
		if cfg.OpenAIKey == "" {
			http.Error(w, "OpenAI key not configured", http.StatusServiceUnavailable)
			return
		}

		// Get user's favourite games from query params
		favouriteGames := r.URL.Query().Get("favourites")
		if favouriteGames == "" {
			http.Error(w, "favourites parameter required", http.StatusBadRequest)
			return
		}

		client := openai.NewClient(cfg.OpenAIKey)

		// Use gpt-3.5-turbo to generate personalized recommendations with optimized prompt
		completionResp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
			Model: "gpt-3.5-turbo",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    "system",
					Content: "You are a game recommendation AI. Return ONLY a valid JSON array with 6 games. Each object needs: name, description, similarity_reason. Use popular game names only. Example: [{\"name\":\"The Witcher 3\",\"description\":\"Epic RPG\",\"similarity_reason\":\"Similar fantasy gameplay\"}]",
				},
				{
					Role:    "user",
					Content: fmt.Sprintf("Favourite games: %s. Recommend 6 similar games. JSON only.", favouriteGames),
				},
			},
			MaxTokens:   600, // Reduced for faster response
			Temperature: 0.3, // Lower temperature for more consistent, faster responses
		})

		if err != nil {
			http.Error(w, "failed to generate recommendations with gpt-3.5-turbo", http.StatusBadGateway)
			return
		}

		// Parse the AI recommendations
		var aiRecommendations []map[string]interface{}
		aiResponse := completionResp.Choices[0].Message.Content

		// Clean up the AI response
		cleanResponse := strings.TrimSpace(aiResponse)

		// Remove markdown formatting if present
		if strings.HasPrefix(cleanResponse, "```json") {
			cleanResponse = strings.TrimPrefix(cleanResponse, "```json")
			cleanResponse = strings.TrimSuffix(cleanResponse, "```")
		} else if strings.HasPrefix(cleanResponse, "```") {
			cleanResponse = strings.TrimPrefix(cleanResponse, "```")
			cleanResponse = strings.TrimSuffix(cleanResponse, "```")
		}

		// Extract JSON array if there's extra text
		if jsonStart := strings.Index(cleanResponse, "["); jsonStart != -1 {
			if jsonEnd := strings.LastIndex(cleanResponse, "]"); jsonEnd != -1 && jsonEnd > jsonStart {
				cleanResponse = cleanResponse[jsonStart : jsonEnd+1]
			}
		}

		if err := json.Unmarshal([]byte(cleanResponse), &aiRecommendations); err != nil {
			// If parsing fails, create fallback recommendations
			aiRecommendations = []map[string]interface{}{
				{
					"name":              "AI Recommendation Error",
					"description":       "Failed to parse AI response: " + aiResponse,
					"similarity_reason": "Please try again",
				},
			}
		}

		// Enhance recommendations with actual game data from RAWG API and AI translation
		enhancedRecommendations := make([]map[string]interface{}, 0)

		// Use concurrent goroutines to speed up RAWG API calls
		type gameResult struct {
			index int
			data  map[string]interface{}
			err   error
		}

		gameChan := make(chan gameResult, len(aiRecommendations))

		// Launch concurrent searches for all games
		for i, rec := range aiRecommendations {
			go func(index int, recommendation map[string]interface{}) {
				gameName, ok := recommendation["name"].(string)
				if !ok {
					gameChan <- gameResult{index: index, data: nil, err: fmt.Errorf("invalid game name")}
					return
				}

				fmt.Printf("🔍 Searching RAWG API for game: %s\n", gameName)
				gameData, err := searchGameInRAWG(gameName, cfg.RawgAPIKey)
				gameChan <- gameResult{index: index, data: gameData, err: err}
			}(i, rec)
		}

		// Collect results in order
		results := make([]gameResult, len(aiRecommendations))
		for i := 0; i < len(aiRecommendations); i++ {
			results[i] = <-gameChan
		}

		// Process results
		for _, result := range results {
			if result.err != nil {
				fmt.Printf("❌ Failed to get data for game at index %d: %v\n", result.index, result.err)
				continue
			}

			rec := aiRecommendations[result.index]
			gameData := result.data
			gameName, _ := rec["name"].(string)

			if gameData == nil {
				// If we can't find the game, use the AI data as fallback
				fmt.Printf("❌ RAWG API search failed for %s\n", gameName)
				rec["background_image"] = ""
				rec["slug"] = strings.ToLower(strings.ReplaceAll(gameName, " ", "-"))
				rec["genres"] = []string{}
				rec["platforms"] = []string{}
			} else {
				fmt.Printf("✅ RAWG API found game %s with image: %s\n", gameName, gameData["background_image"])
				// Enhance with real game data
				rec["background_image"] = gameData["background_image"]
				rec["slug"] = gameData["slug"]
				rec["genres"] = gameData["genres"]
				rec["platforms"] = gameData["platforms"]
				rec["rating"] = gameData["rating"]
				rec["released"] = gameData["released"]

				// Use AI to translate and enhance the RAWG data
				enhancedData, err := enhanceGameDataWithAI(rec, favouriteGames, cfg.OpenAIKey)
				if err == nil {
					// Merge AI-enhanced data
					for key, value := range enhancedData {
						rec[key] = value
					}
				}
			}

			enhancedRecommendations = append(enhancedRecommendations, rec)
		}

		// Return the enhanced recommendations
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"recommendations": enhancedRecommendations,
			"model":           "gpt-3.5-turbo-enhanced",
			"favourites":      favouriteGames,
		}

		json.NewEncoder(w).Encode(response)
	})

	// Test endpoint: Mock recommendations without OpenAI
	r.Get("/games/test-recommendations", func(w http.ResponseWriter, r *http.Request) {
		favouriteGames := r.URL.Query().Get("favourites")
		if favouriteGames == "" {
			http.Error(w, "favourites parameter required", http.StatusBadRequest)
			return
		}

		// Return mock recommendations
		mockRecommendations := []map[string]interface{}{
			{
				"name":              "The Witcher 3: Wild Hunt",
				"description":       "An epic open-world RPG with rich storytelling and immersive gameplay",
				"similarity_reason": "Similar to your action-adventure preferences",
			},
			{
				"name":              "God of War (2018)",
				"description":       "A cinematic action-adventure with deep combat and emotional storytelling",
				"similarity_reason": "Matches your preference for narrative-driven action games",
			},
			{
				"name":              "Horizon Zero Dawn",
				"description":       "An open-world action RPG with unique combat and exploration",
				"similarity_reason": "Similar open-world action-adventure gameplay",
			},
		}

		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"recommendations": mockRecommendations,
			"model":           "mock-test",
			"favourites":      favouriteGames,
		}

		json.NewEncoder(w).Encode(response)
	})

	log.Printf("server listening on :%s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}

// searchGameInRAWG searches for a game in the RAWG API and returns game data
func searchGameInRAWG(gameName, rawgKey string) (map[string]interface{}, error) {
	// Use the RAWG API to search for the game
	rawgURL := fmt.Sprintf("https://api.rawg.io/api/games?search=%s&key=%s", url.QueryEscape(gameName), rawgKey)
	fmt.Printf("🔍 RAWG API URL: %s\n", rawgURL)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second, // 10 second timeout for RAWG API calls
	}

	resp, err := client.Get(rawgURL)
	if err != nil {
		fmt.Printf("❌ RAWG API request failed: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("❌ RAWG API returned status %d\n", resp.StatusCode)
		return nil, fmt.Errorf("RAWG API returned status %d", resp.StatusCode)
	}

	var searchResult struct {
		Results []struct {
			ID              int     `json:"id"`
			Slug            string  `json:"slug"`
			Name            string  `json:"name"`
			BackgroundImage string  `json:"background_image"`
			Rating          float64 `json:"rating"`
			Released        string  `json:"released"`
			Genres          []struct {
				Name string `json:"name"`
			} `json:"genres"`
			Platforms []struct {
				Platform struct {
					Name string `json:"name"`
				} `json:"platform"`
			} `json:"platforms"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchResult); err != nil {
		return nil, err
	}

	if len(searchResult.Results) == 0 {
		fmt.Printf("❌ No results found for game: %s\n", gameName)
		return nil, fmt.Errorf("game not found")
	}

	fmt.Printf("✅ Found %d results for game: %s\n", len(searchResult.Results), gameName)

	// Get the first (most relevant) result
	game := searchResult.Results[0]
	fmt.Printf("🎮 Selected game: %s (ID: %d)\n", game.Name, game.ID)
	fmt.Printf("🖼️ Background image: %s\n", game.BackgroundImage)

	// Extract genres
	genres := make([]string, len(game.Genres))
	for i, genre := range game.Genres {
		genres[i] = genre.Name
	}

	// Extract platforms
	platforms := make([]string, len(game.Platforms))
	for i, platform := range game.Platforms {
		platforms[i] = platform.Platform.Name
	}

	return map[string]interface{}{
		"background_image": game.BackgroundImage,
		"slug":             game.Slug,
		"genres":           genres,
		"platforms":        platforms,
		"rating":           game.Rating,
		"released":         game.Released,
	}, nil
}

// enhanceGameDataWithAI uses GPT-3.5-turbo to translate and enhance RAWG API data
func enhanceGameDataWithAI(gameData map[string]interface{}, userFavourites, openAIKey string) (map[string]interface{}, error) {
	client := openai.NewClient(openAIKey)

	// Prepare the game data for AI analysis
	gameName := gameData["name"].(string)
	genres := gameData["genres"].([]string)
	platforms := gameData["platforms"].([]string)
	rating := gameData["rating"].(float64)
	released := gameData["released"].(string)

	// Create a prompt for AI to enhance the data
	prompt := fmt.Sprintf(`
Based on the user's favourite games (%s), enhance this game recommendation with personalized insights:

Game: %s
Genres: %s
Platforms: %s
Rating: %.1f/5
Released: %s

Please provide:
1. A personalized description (2-3 sentences) explaining why this game matches their preferences
2. A similarity reason (1 sentence) connecting it to their favourite games
3. An estimated playtime based on the game type and user preferences
4. A personalized recommendation score (0.0-1.0) based on how well it matches their taste

Return as JSON with fields: personalized_description, similarity_reason, estimated_playtime, recommendation_score
`, userFavourites, gameName, strings.Join(genres, ", "), strings.Join(platforms, ", "), rating, released)

	completionResp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: "gpt-3.5-turbo",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    "system",
				Content: "You are a game recommendation expert. Analyze game data and user preferences to provide personalized insights. Return ONLY valid JSON with the requested fields.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		MaxTokens: 300,
	})

	if err != nil {
		return nil, err
	}

	// Parse the AI response
	var aiEnhancement map[string]interface{}
	if err := json.Unmarshal([]byte(completionResp.Choices[0].Message.Content), &aiEnhancement); err != nil {
		return nil, err
	}

	return aiEnhancement, nil
}

func urlQueryEscape(s string) string {
	// Small helper to avoid importing net/url everywhere in this file
	return (&url.URL{Path: s}).EscapedPath()
}

// generateSteamRecommendations creates AI-powered game recommendations based on Steam profile
func generateSteamRecommendations(gamesData, profileData map[string]interface{}, openAIKey string) map[string]interface{} {
	// Extract games from Steam API response
	games, ok := gamesData["response"].(map[string]interface{})
	if !ok {
		return map[string]interface{}{
			"error": "Failed to parse Steam games data",
		}
	}

	gamesList, ok := games["games"].([]interface{})
	if !ok || len(gamesList) == 0 {
		return map[string]interface{}{
			"error": "No games found in Steam library",
		}
	}

	// Extract top played games (most playtime)
	var topGames []string
	var totalPlaytime float64
	gameGenres := make(map[string]int)

	for _, game := range gamesList {
		gameMap, ok := game.(map[string]interface{})
		if !ok {
			continue
		}

		playtime, _ := gameMap["playtime_forever"].(float64)
		totalPlaytime += playtime

		// Get top 10 most played games
		if len(topGames) < 10 {
			if name, ok := gameMap["name"].(string); ok {
				topGames = append(topGames, name)
			}
		}

		// Extract genres (simplified)
		if name, ok := gameMap["name"].(string); ok {
			nameLower := strings.ToLower(name)
			if strings.Contains(nameLower, "strategy") || strings.Contains(nameLower, "rts") {
				gameGenres["Strategy"]++
			}
			if strings.Contains(nameLower, "rpg") || strings.Contains(nameLower, "role") {
				gameGenres["RPG"]++
			}
			if strings.Contains(nameLower, "shooter") || strings.Contains(nameLower, "fps") {
				gameGenres["Shooter"]++
			}
			if strings.Contains(nameLower, "puzzle") || strings.Contains(nameLower, "indie") {
				gameGenres["Puzzle/Indie"]++
			}
			if strings.Contains(nameLower, "racing") || strings.Contains(nameLower, "car") {
				gameGenres["Racing"]++
			}
			if strings.Contains(nameLower, "simulation") || strings.Contains(nameLower, "sim") {
				gameGenres["Simulation"]++
			}
		}
	}

	// Determine gaming profile
	var gamingLevel string
	avgPlaytime := totalPlaytime / float64(len(gamesList))
	if totalPlaytime > 2000 {
		gamingLevel = "Hardcore Gamer"
	} else if totalPlaytime > 1000 {
		gamingLevel = "Enthusiast"
	} else if totalPlaytime > 500 {
		gamingLevel = "Regular Gamer"
	} else {
		gamingLevel = "Casual Gamer"
	}

	// Find preferred genres
	var preferredGenres []string
	maxCount := 0
	for genre, count := range gameGenres {
		if count > maxCount {
			maxCount = count
			preferredGenres = []string{genre}
		} else if count == maxCount {
			preferredGenres = append(preferredGenres, genre)
		}
	}

	// Create prompt for OpenAI
	topGamesStr := strings.Join(topGames[:min(5, len(topGames))], ", ")
	preferredGenresStr := strings.Join(preferredGenres, ", ")

	prompt := fmt.Sprintf(`Based on this Steam gaming profile, recommend 5 games:

Gaming Profile:
- Total Games: %d
- Total Playtime: %.1f hours
- Gaming Level: %s
- Top Games: %s
- Preferred Genres: %s
- Average Playtime per Game: %.1f hours

Please recommend 5 games that match this player's preferences. For each recommendation, provide:
1. Game name
2. Brief reason why they'd like it
3. Confidence level (1-10)
4. Genre
5. Estimated playtime

Format as JSON with this structure:
{
  "recommendations": [
    {
      "gameName": "Game Name",
      "reason": "Why they'd like it",
      "confidence": 8,
      "genre": "Genre",
      "estimatedPlaytime": "20-40 hours"
    }
  ],
  "gamingProfile": {
    "preferredGenres": ["%s"],
    "playStyle": "Based on their gaming patterns",
    "gamingLevel": "%s",
    "interests": ["derived from their game library"]
  }
}`, len(gamesList), totalPlaytime/60, gamingLevel, topGamesStr, preferredGenresStr, avgPlaytime/60, preferredGenresStr, gamingLevel)

	// Call OpenAI API
	client := &http.Client{Timeout: 30 * time.Second}
	requestBody := map[string]interface{}{
		"model": "gpt-3.5-turbo",
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": "You are a gaming expert who analyzes Steam profiles and recommends games. Always respond with valid JSON.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"max_tokens":  1000,
		"temperature": 0.7,
	}

	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to create OpenAI request",
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIKey)

	resp, err := client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to call OpenAI API",
		}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to read OpenAI response",
		}
	}

	var openAIResponse map[string]interface{}
	if err := json.Unmarshal(body, &openAIResponse); err != nil {
		return map[string]interface{}{
			"error": "Failed to parse OpenAI response",
		}
	}

	// Extract the content from OpenAI response
	if choices, ok := openAIResponse["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					// Try to parse the JSON response from OpenAI
					var recommendations map[string]interface{}
					if err := json.Unmarshal([]byte(content), &recommendations); err == nil {
						return recommendations
					}
				}
			}
		}
	}

	// Fallback: return basic recommendations
	return map[string]interface{}{
		"recommendations": []map[string]interface{}{
			{
				"gameName":          "Based on your gaming profile",
				"reason":            "AI analysis of your Steam library",
				"confidence":        7,
				"genre":             preferredGenres[0],
				"estimatedPlaytime": "20-40 hours",
			},
		},
		"gamingProfile": map[string]interface{}{
			"preferredGenres": preferredGenres,
			"playStyle":       "Based on your gaming patterns",
			"gamingLevel":     gamingLevel,
			"interests":       preferredGenres,
		},
	}
}

// generateComprehensiveSteamAnalysis creates detailed AI analysis of all Steam games
func generateComprehensiveSteamAnalysis(analysisRequest struct {
	SteamId       string `json:"steamId"`
	PlayerName    string `json:"playerName"`
	TotalGames    int    `json:"totalGames"`
	TotalPlaytime int    `json:"totalPlaytime"`
	Games         []struct {
		Name           string `json:"name"`
		Playtime       int    `json:"playtime"`
		RecentPlaytime int    `json:"recentPlaytime"`
		Appid          int    `json:"appid"`
	} `json:"games"`
}, openAIKey string) map[string]interface{} {
	// Analyze gaming patterns
	var totalPlaytime float64
	var recentPlaytime float64
	gameGenres := make(map[string]int)
	playtimeDistribution := make(map[string]int)
	var topGames []string
	var recentGames []string

	// Sort games by playtime for analysis
	for _, game := range analysisRequest.Games {
		totalPlaytime += float64(game.Playtime)
		recentPlaytime += float64(game.RecentPlaytime)

		// Categorize by playtime
		if game.Playtime > 1000 {
			playtimeDistribution["Heavy"]++
		} else if game.Playtime > 100 {
			playtimeDistribution["Moderate"]++
		} else if game.Playtime > 10 {
			playtimeDistribution["Light"]++
		} else {
			playtimeDistribution["Minimal"]++
		}

		// Extract genres from game names
		nameLower := strings.ToLower(game.Name)
		if strings.Contains(nameLower, "strategy") || strings.Contains(nameLower, "rts") || strings.Contains(nameLower, "tactical") {
			gameGenres["Strategy"]++
		}
		if strings.Contains(nameLower, "rpg") || strings.Contains(nameLower, "role") || strings.Contains(nameLower, "adventure") {
			gameGenres["RPG/Adventure"]++
		}
		if strings.Contains(nameLower, "shooter") || strings.Contains(nameLower, "fps") || strings.Contains(nameLower, "tps") {
			gameGenres["Shooter"]++
		}
		if strings.Contains(nameLower, "puzzle") || strings.Contains(nameLower, "indie") || strings.Contains(nameLower, "casual") {
			gameGenres["Puzzle/Indie"]++
		}
		if strings.Contains(nameLower, "racing") || strings.Contains(nameLower, "car") || strings.Contains(nameLower, "driving") {
			gameGenres["Racing"]++
		}
		if strings.Contains(nameLower, "simulation") || strings.Contains(nameLower, "sim") || strings.Contains(nameLower, "management") {
			gameGenres["Simulation"]++
		}
		if strings.Contains(nameLower, "action") || strings.Contains(nameLower, "platformer") || strings.Contains(nameLower, "beat") {
			gameGenres["Action"]++
		}
		if strings.Contains(nameLower, "sports") || strings.Contains(nameLower, "football") || strings.Contains(nameLower, "basketball") {
			gameGenres["Sports"]++
		}

		// Get top games by playtime
		if len(topGames) < 10 && game.Playtime > 0 {
			topGames = append(topGames, game.Name)
		}

		// Get recent games
		if len(recentGames) < 5 && game.RecentPlaytime > 0 {
			recentGames = append(recentGames, game.Name)
		}
	}

	// Determine gaming characteristics
	var gamingLevel string
	var playStyle string
	var genrePreferences string

	avgPlaytime := totalPlaytime / float64(analysisRequest.TotalGames)
	if totalPlaytime > 5000 {
		gamingLevel = "Hardcore Gamer - Extensive gaming experience with deep engagement"
	} else if totalPlaytime > 2000 {
		gamingLevel = "Enthusiast - Regular gaming with diverse interests"
	} else if totalPlaytime > 500 {
		gamingLevel = "Regular Gamer - Consistent gaming habits with moderate playtime"
	} else {
		gamingLevel = "Casual Gamer - Light gaming with selective play"
	}

	// Analyze play style
	if playtimeDistribution["Heavy"] > playtimeDistribution["Moderate"] {
		playStyle = "Deep Diver - Prefers to invest significant time in fewer games"
	} else if playtimeDistribution["Moderate"] > playtimeDistribution["Light"] {
		playStyle = "Balanced Player - Mixes deep and casual gaming experiences"
	} else {
		playStyle = "Explorer - Enjoys trying many different games"
	}

	// Find preferred genres
	var preferredGenres []string
	maxCount := 0
	for genre, count := range gameGenres {
		if count > maxCount {
			maxCount = count
			preferredGenres = []string{genre}
		} else if count == maxCount {
			preferredGenres = append(preferredGenres, genre)
		}
	}

	genrePreferences = strings.Join(preferredGenres, ", ")

	// Create comprehensive analysis prompt
	topGamesStr := strings.Join(topGames[:min(5, len(topGames))], ", ")
	recentGamesStr := strings.Join(recentGames[:min(3, len(recentGames))], ", ")

	prompt := fmt.Sprintf(`Analyze this comprehensive Steam gaming profile and provide detailed insights:

Player: %s
Total Games: %d
Total Playtime: %.1f hours
Average Playtime per Game: %.1f hours
Recent Activity: %.1f hours in last 2 weeks

Top Games: %s
Recent Games: %s
Genre Distribution: %v
Playtime Distribution: %v

Provide a comprehensive analysis including:
1. Detailed gaming profile assessment
2. Genre preferences analysis
3. Play style characteristics
4. Gaming level assessment
5. Detailed insights about gaming patterns
6. Specific game recommendations with match scores

Format as JSON:
{
  "gamingProfile": "Detailed assessment of their gaming profile",
  "genrePreferences": "Analysis of genre preferences and patterns",
  "playStyle": "Detailed play style analysis",
  "gamingLevel": "Comprehensive gaming level assessment",
  "insights": "Detailed insights about their gaming patterns and preferences",
  "recommendations": [
    {
      "name": "Game Name",
      "reason": "Detailed reason for recommendation",
      "score": 9
    }
  ]
}`, analysisRequest.PlayerName, analysisRequest.TotalGames, totalPlaytime/60, avgPlaytime/60, recentPlaytime/60, topGamesStr, recentGamesStr, gameGenres, playtimeDistribution)

	// Call OpenAI API for comprehensive analysis
	client := &http.Client{Timeout: 60 * time.Second}
	requestBody := map[string]interface{}{
		"model": "gpt-3.5-turbo",
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": "You are an expert gaming analyst who provides comprehensive insights into Steam gaming profiles. Always respond with valid JSON.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"max_tokens":  2000,
		"temperature": 0.7,
	}

	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to create OpenAI request",
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIKey)

	resp, err := client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to call OpenAI API",
		}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to read OpenAI response",
		}
	}

	var openAIResponse map[string]interface{}
	if err := json.Unmarshal(body, &openAIResponse); err != nil {
		return map[string]interface{}{
			"error": "Failed to parse OpenAI response",
		}
	}

	// Extract the content from OpenAI response
	if choices, ok := openAIResponse["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					// Try to parse the JSON response from OpenAI
					var analysis map[string]interface{}
					if err := json.Unmarshal([]byte(content), &analysis); err == nil {
						return analysis
					}
				}
			}
		}
	}

	// Fallback: return basic analysis
	return map[string]interface{}{
		"gamingProfile":    gamingLevel,
		"genrePreferences": fmt.Sprintf("Primary interests in: %s", genrePreferences),
		"playStyle":        playStyle,
		"gamingLevel":      gamingLevel,
		"insights":         fmt.Sprintf("Player has %d games with %.1f total hours. Shows preference for %s games with %s play style.", analysisRequest.TotalGames, totalPlaytime/60, genrePreferences, playStyle),
		"recommendations": []map[string]interface{}{
			{
				"name":   "Based on comprehensive analysis",
				"reason": "AI analysis of complete Steam library",
				"score":  8,
			},
		},
	}
}

// generatePatternBasedRecommendations creates focused game recommendations based on playtime patterns
func generatePatternBasedRecommendations(analysisRequest struct {
	SteamId       string `json:"steamId"`
	PlayerName    string `json:"playerName"`
	TotalGames    int    `json:"totalGames"`
	TotalPlaytime int    `json:"totalPlaytime"`
	TopGames      []struct {
		Name           string `json:"name"`
		Playtime       int    `json:"playtime"`
		RecentPlaytime int    `json:"recentPlaytime"`
	} `json:"topGames"`
	RecentGames []struct {
		Name           string `json:"name"`
		Playtime       int    `json:"playtime"`
		RecentPlaytime int    `json:"recentPlaytime"`
	} `json:"recentGames"`
}, openAIKey string) map[string]interface{} {
	// Analyze gaming patterns
	var totalPlaytime float64
	var recentPlaytime float64
	var avgPlaytimePerGame float64

	// Calculate total and recent playtime
	for _, game := range analysisRequest.TopGames {
		totalPlaytime += float64(game.Playtime)
		recentPlaytime += float64(game.RecentPlaytime)
	}

	avgPlaytimePerGame = totalPlaytime / float64(analysisRequest.TotalGames)

	// Determine gaming patterns
	var gamingPattern string
	var playtimePreference string

	if avgPlaytimePerGame > 100 {
		gamingPattern = "Deep Diver - Prefers games with extensive playtime"
		playtimePreference = "Long-form gaming experiences"
	} else if avgPlaytimePerGame > 20 {
		gamingPattern = "Balanced Player - Mixes short and long gaming sessions"
		playtimePreference = "Moderate gaming sessions"
	} else {
		gamingPattern = "Casual Explorer - Prefers quick gaming sessions"
		playtimePreference = "Short gaming sessions"
	}

	// Analyze top games for genre preferences
	topGamesStr := ""
	for i, game := range analysisRequest.TopGames {
		if i < 5 {
			topGamesStr += fmt.Sprintf("%s (%d hours), ", game.Name, game.Playtime/60)
		}
	}

	recentGamesStr := ""
	for i, game := range analysisRequest.RecentGames {
		if i < 3 {
			recentGamesStr += fmt.Sprintf("%s (%d hours), ", game.Name, game.RecentPlaytime/60)
		}
	}

	// Create focused recommendation prompt
	prompt := fmt.Sprintf(`Based on this Steam gaming profile, recommend 5 games that match their playtime patterns and preferences:

Player: %s
Total Games: %d
Total Playtime: %.1f hours
Average Playtime per Game: %.1f hours
Gaming Pattern: %s
Playtime Preference: %s

Top Played Games: %s
Recent Games: %s

Focus on:
1. Games that match their playtime patterns (short vs long sessions)
2. Games similar to their most played games
3. Games that fit their gaming style and time investment
4. Consider their recent gaming activity

For each recommendation, provide:
- Game name
- Brief reason why it matches their patterns
- Confidence level (1-10)
- Genre
- Estimated playtime

Format as JSON:
{
  "recommendations": [
    {
      "gameName": "Game Name",
      "reason": "Why it matches their gaming patterns",
      "confidence": 8,
      "genre": "Genre",
      "estimatedPlaytime": "20-40 hours"
    }
  ],
  "gamingProfile": {
    "preferredGenres": ["based on their top games"],
    "playStyle": "%s",
    "gamingLevel": "based on total playtime",
    "interests": ["derived from their most played games"]
  }
}`, analysisRequest.PlayerName, analysisRequest.TotalGames, totalPlaytime/60, avgPlaytimePerGame/60, gamingPattern, playtimePreference, topGamesStr, recentGamesStr, gamingPattern)

	// Call OpenAI API for focused recommendations
	client := &http.Client{Timeout: 30 * time.Second}
	requestBody := map[string]interface{}{
		"model": "gpt-3.5-turbo",
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": "You are a gaming expert who analyzes Steam playtime patterns and recommends games that match a player's gaming style. Always respond with valid JSON.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"max_tokens":  1000,
		"temperature": 0.7,
	}

	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBody))
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to create OpenAI request",
		}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+openAIKey)

	resp, err := client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to call OpenAI API",
		}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to read OpenAI response",
		}
	}

	var openAIResponse map[string]interface{}
	if err := json.Unmarshal(body, &openAIResponse); err != nil {
		return map[string]interface{}{
			"error": "Failed to parse OpenAI response",
		}
	}

	// Extract the content from OpenAI response
	if choices, ok := openAIResponse["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					// Try to parse the JSON response from OpenAI
					var recommendations map[string]interface{}
					if err := json.Unmarshal([]byte(content), &recommendations); err == nil {
						return recommendations
					}
				}
			}
		}
	}

	// Fallback: return basic pattern-based recommendations
	return map[string]interface{}{
		"recommendations": []map[string]interface{}{
			{
				"gameName":          "Based on your gaming patterns",
				"reason":            fmt.Sprintf("Matches your %s gaming style", gamingPattern),
				"confidence":        7,
				"genre":             "Based on your top games",
				"estimatedPlaytime": fmt.Sprintf("%.0f-%.0f hours", avgPlaytimePerGame/60, avgPlaytimePerGame/30),
			},
		},
		"gamingProfile": map[string]interface{}{
			"preferredGenres": []string{"Based on your top games"},
			"playStyle":       gamingPattern,
			"gamingLevel":     fmt.Sprintf("Based on %.1f total hours", totalPlaytime/60),
			"interests":       []string{"Derived from your most played games"},
		},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
