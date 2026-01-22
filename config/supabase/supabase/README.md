# Supabase Setup

## Requirements
- Supabase project (cloud) or Supabase CLI + Docker for local dev

## Using Supabase Cloud
1. SQL Editor → run `supabase/migrations/0001_init.sql` (schema & extensions)
2. Optionally run `supabase/seed.sql`

## Using Supabase CLI (Local Docker)
1. Install CLI: `brew install supabase/tap/supabase`
2. Initialize (once):
   ```bash
   supabase init
   ```
3. Start local stack:
   ```bash
   supabase start
   ```
4. Apply migrations (this creates tables before seeding):
   ```bash
   supabase migration up
   ```
5. (Optional) Seed data:
   ```bash
   psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/seed.sql
   ```
   (Adjust host/port/user/password to match `supabase status` output.)

If you see `relation "public.games" does not exist`, it means the seed ran before the migration. Run step 4 (migrations) first, then re-run the seed.

## Env Vars (Frontend/Backend)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Similarity Query
```
SELECT id, name
FROM public.games
ORDER BY embedding <-> :user_embedding
LIMIT 10;
```

Note: Embedding dimension (1536) matches the model used in the Go example.
