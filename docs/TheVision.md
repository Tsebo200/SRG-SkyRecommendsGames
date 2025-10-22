# SRG - Sky Recommends Games

**AI-Powered Game Recommendation Mobile Application**

SRG (Sky Recommends Games) helps users discover personalized game recommendations using a rubric-driven AI approach and the user’s explicit preferences. The app integrates with gaming platforms (Steam, Xbox, PSN, Nintendo) to analyze play patterns, then ranks and explains results in a transparent, user-friendly feed.

## Features

### 🎮 Core Features

#### Game Recommendations (Rubric + Preferences)
- Based on SSG rubric scores: Completeness, Monetisation, Accessibility, Creativity.
- Respects user preferences (e.g., "no pay-to-win", "must have strong accessibility support").
- Display as a scrollable card feed with:
  - Game art
  - Short rubric scores
  - Links to store and trailer

#### Favourites & Wishlist
- Users can bookmark games they like.
- Push notifications when rubric scores update or new games release.

### 🔗 Integration Features
- **QR Code Scanner**: Scan QR codes from SkyScansGames to get detailed game information
- **Cross-Platform Sync**: Seamless integration with SkyScansGames for comprehensive game analysis
- **Barcode Integration**: Direct game data transfer without manual input

### ♿ Accessibility Features
- **Theme Support**: Light mode, dark mode, and custom color themes
- **Color Accessibility**: Color vision modes (Protanopia, Deuteranopia, Tritanopia; extended: protanomaly, deuteranomaly, achromatopsia)
- **Speech Features**: Text-to-speech and speech-to-text capabilities
- **Reduce Motion**: Global toggle to disable non-essential animations
- **Contrast Levels**: WCAG 2.2 AA default, optional AAA mode
- **Color Palette Presets**: Customizable color schemes for better accessibility

### 🎯 Personalization
- **User Profiles**: Individual gaming profiles with unique preferences
- **Onboarding Flow**: Customizable metrics based on user preferences
- **Taste Analysis**: AI learns from user feedback and gaming patterns
- **Recommendation History**: Track and improve recommendation accuracy

## Technology Stack

- **Frontend**: Expo Go SDK 54 (React Native via Expo)
- **Backend**: Go (Golang) with OpenAPI (Swagger-like) support for typed endpoints
- **AI/Embeddings**: OpenAI GPT-4 or Anthropic Claude for rubric + summary; embeddings stored in Supabase (SQL + Vector DB)
- **Vector Similarity**: Supabase pgvector for nearest-neighbor recommendations
- **User Auth & Preferences**: Firebase Authentication; user preferences stored via Firebase
- **Database (App/Local/Dev)**: SQLite with SQLAlchemy ORM (for local prototyping and non-embedding data)
- **Gaming APIs**: RAWG API, Steam API, Xbox API, PSN API
- **State Management**: Zustand
- **Navigation**: React Navigation
- **UI**: Liquid Glass design treatment; `react-charts` for curated SSG metrics (tweaked by SRG onboarding)

## Project Structure

```
SkyRecommendsGames/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services and integrations
│   ├── store/              # State management (Zustand)
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── constants/          # App constants and configuration
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
├── backend/                # Backend API server
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js (>=18)
- Expo CLI
- Android Studio (for Android)
- Xcode (for iOS)
- Go 1.22+ (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tsebo200/SkyRecommendsGames.git
   cd SkyRecommendsGames
   ```

2. **Install dependencies**
   ```bash
   npm install
   npx expo prebuild # if using native modules
   ```

3. **Setup backend (Go)**
   ```bash
   cd backend
   go mod tidy
   go run ./cmd/server
   ```

4. **Run the application**
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS
   npx expo run:ios
   ```

### Environment Setup

Create a `.env` file in the root directory:

```env
# API Keys
RAWG_API_KEY=your_rawg_api_key
STEAM_API_KEY=your_steam_api_key
XBOX_API_KEY=your_xbox_api_key
PSN_API_KEY=your_psn_api_key
NINTENDO_API_KEY=your_nintendo_api_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
BACKEND_URL=http://localhost:8080
```

## Key Features Implementation

### 1. Game Recommendations (MVP)
- Compute SSG rubric scores (Completeness, Monetisation, Accessibility, Creativity).
- Combine user preferences and platform data.
- Rank via vector similarity + rule-based filters.

### 2. Favourites & Wishlist
- Bookmarking, lists, and notifications on updates/new releases.

### 3. Feedback System
- Game rating system (1-5 stars) and optional text/voice feedback.
- Use feedback to refine embeddings and heuristics.

### 4. Accessibility Features
- Multiple themes (light/dark/custom), color vision modes, reduce motion, TTS/STT, haptics.

### 5. QR Code Integration
- Scan QR codes from SkyScansGames, auto-populate game data, and sync across platforms.

## API Integration
## AI/Embeddings Example (Go + Supabase)

Go embeddings function using OpenAI client:

```go
import (
    "context"
    openai "github.com/sashabaranov/go-openai"
)

func GetEmbeddingsForText(text string) ([]float32, error) {
    client := openai.NewClient("YOUR_OPENAI_API_KEY")
    resp, err := client.CreateEmbeddings(context.Background(), openai.EmbeddingRequest{
        Input: []string{text},
        Model: openai.AdaEmbeddingV2,
    })
    if err != nil {
        return nil, err
    }
    return resp.Data[0].Embedding, nil
}
```

Vector similarity query (pgvector example):

```sql
SELECT *
FROM games
ORDER BY embedding <-> :user_embedding
LIMIT 10;
```

Note: MVP focuses on the AI recommendation feature (embeddings + similarity). After backend basics are set up and validated, we will explore TensorFlow and AWS Personalize.

The app integrates with multiple gaming platforms and APIs:

- **RAWG API**: Game database and metadata
- **Steam API**: Steam profile and game data
- **Xbox API**: Xbox Live profile and achievements
- **PSN API**: PlayStation Network data
- **Nintendo API**: Nintendo account integration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

## Links

- **SkyScansGames Integration**: https://github.com/Tsebo200/SkyScansGames
- **Documentation**: [Link to documentation]
- **API Documentation**: [Link to API docs]

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**SRG - Sky Recommends Games** - Discover your next favourite game with AI-powered recommendations!
