# SRG Frontend - Expo React Native App

## Overview
This is the frontend mobile application for Sky Recommends Games (SRG), built with Expo SDK 54 and React Native. The app provides AI-powered game recommendations with a beautiful Liquid Glass UI design.

## Features
- **Game Search**: Debounced search functionality with RAWG API integration
- **AI Recommendations**: Games are automatically processed with OpenAI embeddings
- **Liquid Glass UI**: Beautiful blur effects and gradients for modern aesthetics
- **Expo Router**: File-based routing for navigation
- **Accessibility Ready**: Built with accessibility considerations in mind

## Tech Stack
- **Expo SDK 54**: Latest stable version with React Native 0.81.4
- **Expo Router 6.0.12**: File-based routing system
- **TypeScript**: Full type safety
- **Liquid Glass UI**: Custom GlassCard component with expo-blur and expo-linear-gradient
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack React Query for server state
- **Animations**: Moti for smooth animations, react-native-reanimated for gestures

## Project Structure
```
frontend/SRG/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   └── search.tsx         # Search screen
├── components/            # Reusable components
│   └── GlassCard.tsx     # Liquid Glass UI component
├── lib/                   # Utilities and API client
│   └── api.ts            # Backend API integration
├── assets/               # Images and static assets
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend/SRG
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env and set your backend URL
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Environment Variables
Create a `.env` file in the frontend/SRG directory:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
```

## Development

### Running the App
- **iOS**: `npm run ios` or press `i` in the terminal
- **Android**: `npm run android` or press `a` in the terminal  
- **Web**: `npm run web` or press `w` in the terminal

### Key Features Implementation

#### 1. Debounced Search
The search screen implements a 500ms debounced search to prevent excessive API calls:
```typescript
const debouncedSearch = useCallback(
  (() => {
    let timeoutId: NodeJS.Timeout;
    return (searchQuery: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        // Search logic here
      }, 500);
    };
  })(),
  []
);
```

#### 2. Liquid Glass UI
The GlassCard component provides beautiful blur effects:
```typescript
<BlurView intensity={20} tint="dark">
  <LinearGradient
    colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']}
    // ... gradient configuration
  />
</BlurView>
```

#### 3. API Integration
The app connects to the Go backend for:
- Game search via RAWG API proxy
- Game upsert with AI embeddings
- Similar game recommendations

## Backend Integration

### API Endpoints Used
- `GET /rawg/search?q={query}` - Search games via RAWG API
- `POST /games/upsert` - Add game with AI embedding
- `GET /games/similar` - Get similar games by embedding
- `GET /health` - Health check

### Error Handling
- Network timeouts (10 seconds)
- Graceful error messages for users
- Console logging for debugging

## Accessibility Features
- **WCAG AA/AAA Compliance**: Built with accessibility in mind
- **Color Vision Support**: Ready for color blind modes
- **Reduced Motion**: Respects user's motion preferences
- **Text Hierarchy**: Clear typography with proper contrast
- **Screen Reader Support**: Semantic markup for assistive technologies

## Future Enhancements
- [ ] User authentication with Firebase
- [ ] Favourites and wishlist functionality
- [ ] Push notifications for game updates
- [ ] Advanced accessibility settings panel
- [ ] Haptic feedback for interactions
- [ ] Offline support with caching

## Troubleshooting

### Common Issues
1. **Metro bundler issues**: Clear cache with `npm start -c`
2. **Dependency conflicts**: Use `--legacy-peer-deps` flag
3. **iOS simulator not found**: Install Xcode and iOS Simulator
4. **Android build issues**: Ensure Android Studio is properly configured

### Debug Mode
Enable debug mode in Expo Go app or use React Native Debugger for advanced debugging.

## Contributing
1. Follow the established code style
2. Add TypeScript types for new features
3. Test on both iOS and Android
4. Ensure accessibility compliance
5. Update documentation for new features

## License
This project is part of the Sky Recommends Games application.
