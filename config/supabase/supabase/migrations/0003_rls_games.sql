-- Enable RLS on games and define policies

alter table public.games enable row level security;

-- Allow read for authenticated and anon (adjust later if needed)
drop policy if exists "read games" on public.games;
create policy "read games" on public.games
  for select
  to anon, authenticated
  using (true);

-- Restrict direct writes: only service_role may insert/update/delete directly
drop policy if exists "write games service" on public.games;
create policy "write games service" on public.games
  for all
  to service_role
  using (true)
  with check (true);

-- Secure RPC
create or replace function public.rpc_upsert_game(
  p_slug text,
  p_name text,
  p_platforms text[],
  p_genres text[],
  p_store_urls jsonb,
  p_rubric jsonb,
  p_embedding float4[]
) returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.games (slug, name, platforms, genres, store_urls, rubric, embedding)
  values (p_slug, p_name, p_platforms, p_genres, p_store_urls, p_rubric, p_embedding::vector)
  on conflict (slug) do update set
    name = excluded.name,
    platforms = excluded.platforms,
    genres = excluded.genres,
    store_urls = excluded.store_urls,
    rubric = excluded.rubric,
    embedding = excluded.embedding,
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

-- Grant execute to anon & authenticated (RPC enforces write via definer)
grant execute on function public.rpc_upsert_game(text, text, text[], text[], jsonb, jsonb, float4[]) to anon, authenticated;

