# SRG Backend (Go)

## Prerequisites
- Go 1.22+
- Node.js 18+ (for frontend, optional)

## Setup
1. Create a `.env` at repo root using `docs/env.example`:
   ```bash
   cp docs/env.example .env
   ```
   Fill in `RAWG_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Optional: `OPENAI_API_KEY` (for auto-embeddings).

2. Run the server (it auto-loads `.env` from repo root or parent dirs):
   ```bash
   cd backend
   go mod tidy
   go run ./cmd/server
   ```

## Endpoints
- `GET /health` -> `{ "status": "ok" }`
- `GET /rawg/search?q=...` -> Proxies to RAWG search with server-side throttle and 30s cache.
- `POST /games/upsert` -> Upserts a game via Supabase RPC.
- `GET /games/similar?embedding=...&limit=10` -> Find similar games by embedding similarity.

### Protections & Validation
- CORS: Allows `GET, POST, OPTIONS` from any origin (dev default); headers `Content-Type, Authorization, apikey`.
- Rate limit: 5 requests / 2 seconds per IP on `/rawg/search`.
- Cache: 30s per unique query for `/rawg/search`.
- Validation:
  - `/rawg/search`: `q` must be at least 2 chars.
  - `/games/upsert`: `slug` and `name` required; `embedding` must be 1536 floats if provided.
  - `/games/similar`: `embedding` must be a comma-separated list of floats.

### Embeddings (Optional Auto-Generation)
- If `OPENAI_API_KEY` is set and `embedding` is omitted in `/games/upsert`, the server generates a 1536‑dim embedding using OpenAI (text-embedding-ada-002 compatibility via `AdaEmbeddingV2`) from `name` and `genres`.
- To control embeddings yourself, provide the `embedding` array in the request and omit `OPENAI_API_KEY`.

### Examples
- Upsert
```bash
curl -X POST http://localhost:8080/games/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "sample-upsert",
    "name": "Sample Upsert",
    "platforms": ["pc"],
    "genres": ["rpg"],
    "store_urls": {"steam": "https://store.steampowered.com/app/123"},
    "rubric": {"completeness":4,"monetisation":2,"accessibility":4,"creativity":5}
  }'
```
- Similarity
```bash
curl "http://localhost:8080/games/similar?embedding=0.1,0.2,0.3&limit=5"
```

## Notes
- The server reads `PORT` (default `8080`), `RAWG_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`.
