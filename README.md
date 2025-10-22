<<<<<<< Updated upstream
I Tried Flutter  <br />
<!-- [Here is the experience]([https://link-url-here.org](https://youtu.be/t7LZq0_ATSo)) -->
 <a href="https://youtu.be/t7LZq0_ATSo">Here is the experience</a>
=======
# SRG — Sky Recommends Games

AI-powered game recommendations with rubric scoring, accessibility focus, and modern mobile UX.

## What this project does
- Personalized recommendations based on:
  - SSG rubric scores (Completeness, Monetisation, Accessibility, Creativity)
  - User preferences (e.g., no pay‑to‑win, strong accessibility)
- Multi-platform integration (Steam/Xbox/PSN/Nintendo)
- Accessibility-first design (WCAG AA/AAA, color‑vision modes, reduced motion, TTS/STT)
- Favourites/Wishlist with notifications
- QR/Barcode integration with SkyScansGames (planned)

## Architecture (MVP)
- Frontend: Expo SDK 54 (React Native)
- Backend: Go (chi router), OpenAPI
- Data/Vector: Supabase Postgres + pgvector
- AI: OpenAI/Anthropic (embeddings + rubric summaries)

### Backend protections
- RAWG proxy `/rawg/search` with:
  - Per-IP rate limiter: 5 requests / 2 seconds
  - 30s in-memory cache per query
  - Client guidance: 300–500ms input debounce
- RLS in Supabase:
  - `user_preferences`, `favourites` protected with user‑owned policies
  - `games` has RLS enabled; reads allowed for anon/auth; writes via `rpc_upsert_game` only
- Secure RPC:
  - `rpc_upsert_game` is `SECURITY DEFINER`; clients call RPC, not write tables directly

## Repo map
- `backend/` — Go server, OpenAPI, README
- `supabase/` — migrations, schema, seed, README
- `docs/` — vision and env example
- `.cursor/commands/speckitconstitution.md` — contribution standards (code quality, TDD, accessibility)

## Setup (local)
1. Env
```bash
cp docs/env.example .env
# Fill RAWG_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```
2. Supabase (CLI + Docker)
```bash
supabase start
supabase migration up
# optional seed
brew install libpq && export PATH="/opt/homebrew/opt/libpq/bin:$PATH" # Apple Silicon
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
```
3. Backend
```bash
cd backend
go mod tidy
go run ./cmd/server
```

## API quick tour
- Health
```bash
curl http://localhost:8080/health
```
- RAWG search (server throttled + cached)
```bash
curl "http://localhost:8080/rawg/search?q=zelda"
```
- Upsert game (via Supabase RPC)
```bash
curl -X POST http://localhost:8080/games/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "sample-upsert",
    "name": "Sample Upsert",
    "platforms": ["pc"],
    "genres": ["rpg"],
    "store_urls": {"steam": "https://store.steampowered.com/app/123"},
    "rubric": {"completeness":4,"monetisation":2,"accessibility":4,"creativity":5},
    "embedding": [0.0,0.0,0.0]
  }'
```

## Accessibility commitments
- WCAG 2.2 AA by default; AAA mode toggle
- Color‑vision modes (protanopia/deuteranopia/tritanopia, anomalies, achromatopsia)
- Reduce motion, TTS/STT, large hit targets, clear text hierarchy

## For examiners (how to evaluate)
- Code quality & TDD: see `.cursor/commands/speckitconstitution.md`
- Data layer: check `supabase/migrations/*`, RLS policies, RPC
- API behavior: use curl examples; observe rate limiting and caching on RAWG proxy
- Extensibility: AI embeddings pipeline hooks in backend and Supabase vector schema

## Next milestones
- Similarity query endpoint (top‑N recommendations)
- Frontend scaffold with accessibility settings and search UI
- Embeddings pipeline integration (OpenAI/Anthropic) and rubric generator

## Demo Script (5–7 minutes)
1. Open `README.md` → highlight features and protections (rate limit, RLS, RPC).
2. Show local Supabase running:
   ```bash
   supabase status
   ```
3. Show tables and seed rows:
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "select id, name from public.games limit 5;"
   ```
4. Start backend:
   ```bash
   cd backend && go run ./cmd/server
   ```
5. Health check:
   ```bash
   curl http://localhost:8080/health
   ```
6. RAWG search Adhere to API Usage (explain debounce + server throttle + 30s cache):
   ```bash
   curl "http://localhost:8080/rawg/search?q=zelda"
   ```
7. Upsert via RPC:
   ```bash
   curl -X POST http://localhost:8080/games/upsert \
     -H "Content-Type: application/json" \
     -d '{"slug":"demo-upsert","name":"Demo Upsert","platforms":["pc"],"genres":["rpg"],"store_urls":{"steam":"https://store.steampowered.com/app/123"},"rubric":{"completeness":4,"monetisation":2,"accessibility":4,"creativity":5},"embedding":[0,0,0]}'
   ```
8. Verify row in DB:
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "select slug, name from public.games where slug='demo-upsert';"
   ```
>>>>>>> Stashed changes
