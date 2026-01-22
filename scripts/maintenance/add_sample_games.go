package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	// Connect to local Supabase
	db, err := sql.Open("postgres", "postgres://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Generate sample embeddings (1536 dimensions)
	rand.Seed(time.Now().UnixNano())

	games := []struct {
		id        string
		slug      string
		name      string
		platforms []string
		genres    []string
	}{
		{"550e8400-e29b-41d4-a716-446655440001", "spider-man-remastered", "Spider-Man Remastered", []string{"PlayStation 5", "PC"}, []string{"Action", "Adventure"}},
		{"550e8400-e29b-41d4-a716-446655440002", "spider-man-miles-morales", "Spider-Man: Miles Morales", []string{"PlayStation 5", "PlayStation 4"}, []string{"Action", "Adventure"}},
		{"550e8400-e29b-41d4-a716-446655440003", "batman-arkham-knight", "Batman: Arkham Knight", []string{"PlayStation 4", "Xbox One", "PC"}, []string{"Action", "Adventure"}},
		{"550e8400-e29b-41d4-a716-446655440004", "god-of-war", "God of War", []string{"PlayStation 4", "PC"}, []string{"Action", "Adventure"}},
		{"550e8400-e29b-41d4-a716-446655440005", "horizon-zero-dawn", "Horizon Zero Dawn", []string{"PlayStation 4", "PC"}, []string{"Action", "Adventure"}},
	}

	for _, game := range games {
		// Generate random embedding (1536 dimensions)
		embedding := make([]float64, 1536)
		for i := range embedding {
			embedding[i] = rand.Float64()
		}

		// Convert to string for SQL
		embeddingStr := ""
		for i, val := range embedding {
			if i > 0 {
				embeddingStr += ","
			}
			embeddingStr += fmt.Sprintf("%.6f", val)
		}

		// Insert game
		query := fmt.Sprintf(`
			INSERT INTO games (id, slug, name, platforms, genres, store_urls, rubric, embedding) 
			VALUES ('%s', '%s', '%s', 
					ARRAY['%s', '%s'], 
					ARRAY['%s', '%s'], 
					'{}', '{}', 
					ARRAY[%s]::vector)
			ON CONFLICT (id) DO NOTHING;
		`, game.id, game.slug, game.name,
			game.platforms[0], game.platforms[1],
			game.genres[0], game.genres[1],
			embeddingStr)

		_, err := db.Exec(query)
		if err != nil {
			log.Printf("Error inserting %s: %v", game.name, err)
		} else {
			fmt.Printf("✅ Added: %s\n", game.name)
		}
	}

	fmt.Println("🎯 Added 5 sample games to database!")
}
