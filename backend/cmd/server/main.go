package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
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
	return AppConfig{Port: port, RawgAPIKey: rawg, SupabaseURL: supabaseURL, SupabaseAnon: supabaseAnon, OpenAIKey: openAIKey}
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
		// If no embedding provided, try to generate from name + genres
		if len(req.Embedding) == 0 && cfg.OpenAIKey != "" {
			client := openai.NewClient(cfg.OpenAIKey)
			text := req.Name
			if len(req.Genres) > 0 {
				text = text + " | genres: " + strings.Join(req.Genres, ", ")
			}
			resp, err := client.CreateEmbeddings(r.Context(), openai.EmbeddingRequest{
				Input: []string{text},
				Model: openai.AdaEmbeddingV2, // 1536-dim
			})
			if err != nil || len(resp.Data) == 0 {
				http.Error(w, "failed to generate embedding", http.StatusBadGateway)
				return
			}
			vec := make([]float32, len(resp.Data[0].Embedding))
			copy(vec, resp.Data[0].Embedding)
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
		payload := map[string]any{
			"p_user_embedding": embedding,
			"p_limit":          limitParam,
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

	log.Printf("server listening on :%s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}

func urlQueryEscape(s string) string {
	// Small helper to avoid importing net/url everywhere in this file
	return (&url.URL{Path: s}).EscapedPath()
}
