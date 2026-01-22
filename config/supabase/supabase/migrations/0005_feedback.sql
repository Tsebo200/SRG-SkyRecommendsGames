-- Feedback table to capture per-user reactions and comments
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  game_slug text not null,
  liked boolean null,
  comment text null,
  created_at timestamptz not null default now()
);

comment on table public.feedback is 'Per-user feedback on games (like/dislike/comment)';

-- Basic index for lookup by game and user
create index if not exists feedback_game_idx on public.feedback (game_slug);
create index if not exists feedback_user_idx on public.feedback (user_id);

-- Enable RLS
alter table public.feedback enable row level security;

-- Policies
-- For now, allow inserts from any role (anon or authenticated) to ease onboarding.
-- In production, tighten this to authenticated users only and set user_id via database trigger.
create policy feedback_insert_anyone
  on public.feedback for insert
  to anon, authenticated
  with check (true);

create policy feedback_select_own_or_all
  on public.feedback for select
  to anon, authenticated
  using (true);



