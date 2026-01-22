-- RPC: find similar games by embedding similarity

create or replace function public.rpc_similar_games(
  p_user_embedding float4[],
  p_limit int default 10
) returns table (
  id uuid,
  slug text,
  name text,
  platforms text[],
  genres text[],
  store_urls jsonb,
  rubric jsonb,
  similarity_score float4
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    g.id,
    g.slug,
    g.name,
    g.platforms,
    g.genres,
    g.store_urls,
    g.rubric,
    (1 - (g.embedding <-> p_user_embedding::vector))::float4 as similarity_score
  from public.games g
  where g.embedding is not null
  order by g.embedding <-> p_user_embedding::vector
  limit p_limit;
end;
$$;

-- Grant execute to anon & authenticated
grant execute on function public.rpc_similar_games(float4[], int) to anon, authenticated;

