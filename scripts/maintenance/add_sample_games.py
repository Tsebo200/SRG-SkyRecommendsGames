#!/usr/bin/env python3
import random
import psycopg2

# Generate 1536-dimensional embeddings
def generate_embedding(seed):
    random.seed(seed)
    return [round(random.random(), 6) for _ in range(1536)]

# Connect to local Supabase
conn = psycopg2.connect(
    host="127.0.0.1",
    port="54322",
    database="postgres",
    user="postgres",
    password="postgres"
)

cur = conn.cursor()

# Sample games with embeddings
games = [
    ('550e8400-e29b-41d4-a716-446655440001', 'spider-man-remastered', 'Spider-Man Remastered', generate_embedding(1)),
    ('550e8400-e29b-41d4-a716-446655440002', 'spider-man-miles-morales', 'Spider-Man: Miles Morales', generate_embedding(2)),
    ('550e8400-e29b-41d4-a716-446655440003', 'batman-arkham-knight', 'Batman: Arkham Knight', generate_embedding(3)),
    ('550e8400-e29b-41d4-a716-446655440004', 'god-of-war', 'God of War', generate_embedding(4)),
    ('550e8400-e29b-41d4-a716-446655440005', 'horizon-zero-dawn', 'Horizon Zero Dawn', generate_embedding(5))
]

for game_id, slug, name, embedding in games:
    embedding_str = ','.join(map(str, embedding))
    sql = f"""
    INSERT INTO games (id, slug, name, platforms, genres, store_urls, rubric, embedding) 
    VALUES ('{game_id}', '{slug}', '{name}', 
            ARRAY['PlayStation 5', 'PC'], 
            ARRAY['Action', 'Adventure'], 
            '{{}}', '{{}}', 
            ARRAY[{embedding_str}]::vector)
    ON CONFLICT (id) DO NOTHING;
    """
    cur.execute(sql)
    print(f"Added: {name}")

conn.commit()
cur.close()
conn.close()
print("✅ Added 5 sample games to database!")
