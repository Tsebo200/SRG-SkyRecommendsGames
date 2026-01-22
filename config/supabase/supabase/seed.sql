-- Sample games (embeddings left NULL for now; set real 1536-dim vectors later)
insert into public.games (slug, name, platforms, genres, store_urls, rubric, embedding)
values
  ('game-1', 'Sample Game One', ARRAY['pc', 'ps5'], ARRAY['rpg'], '{"steam":"https://store.steampowered.com/app/000"}'::jsonb, '{"completeness":4,"monetisation":2,"accessibility":4,"creativity":5}'::jsonb, null),
  ('game-2', 'Sample Game Two', ARRAY['xbox', 'switch'], ARRAY['action'], '{"xbox":"https://xbox.com/game/000"}'::jsonb, '{"completeness":3,"monetisation":4,"accessibility":3,"creativity":4}'::jsonb, null)
on conflict (slug) do nothing;

-- Example: given a user embedding, fetch top 10 similar
-- SELECT id, name FROM public.games ORDER BY embedding <-> $1 LIMIT 10;
