-- Initial migration: extensions, tables, indexes, RLS

-- Required extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()
create extension if not exists vector;

-- Tables
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  platforms text[],
  genres text[],
  store_urls jsonb,
  rubric jsonb, -- {completeness, monetisation, accessibility, creativity}
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- Indexes
create index if not exists idx_games_embedding on public.games using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_games_slug on public.games (slug);

-- Updated timestamps trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger games_set_updated
before update on public.games
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated
before update on public.user_preferences
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_preferences enable row level security;
alter table public.favorites enable row level security;

-- Drop existing policies if present to avoid duplicate errors during re-run
drop policy if exists "user can manage own preferences" on public.user_preferences;
drop policy if exists "user can manage own favorites" on public.favorites;

create policy "user can manage own preferences"
  on public.user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user can manage own favorites"
  on public.favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
