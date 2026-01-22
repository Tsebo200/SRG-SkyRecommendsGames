-- RPC: upsert a game with embedding (float array -> vector)

create or replace function public.rpc_upsert_game(
  p_slug text,
  p_name text,
  p_platforms text[],
  p_genres text[],
  p_store_urls jsonb,
  p_rubric jsonb,
  p_embedding float4[]
) returns uuid
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

