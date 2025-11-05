<!-- Repository Information & Links-->

<br />

![GitHub repo size](https://img.shields.io/github/repo-size/Tsebo200/SRG-ReactNative-Expo)
![GitHub watchers](https://img.shields.io/github/watchers/Tsebo200/SRG-ReactNative-Expo)
![GitHub language count](https://img.shields.io/github/languages/count/Tsebo200/SRG-ReactNative-Expo)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Tsebo200/SRG-ReactNative-Expo)
![Github Language](https://img.shields.io/github/languages/top/Tsebo200/SRG-ReactNative-Expo)
![Github Downloads](https://img.shields.io/github/downloads/Tsebo200/SRG-ReactNative-Expo/total)

<!-- HEADER SECTION -->

<h5 align="center" style="padding:0;margin:0;">Tsebo Ramonyalioa</h5>

<h5 align="center" style="padding:0;margin:0;">200200</h5>

<h6 align="center">DV300 - Semester 2 - Term 4 | 2025</h6>

</br>

<p align="center">

  <a href="https://github.com/Tsebo200/SRG-ReactNative-Expo">
    <img src="frontend/SRG/assets/Sky Logo.png" align="center" alt="Sky Logo" width="140" height="140">
  </a>

  <h3 align="center">Sky Recommends Games (SRG)</h3>

  <p align="center">
    An AI-Powered Game Recommendation Mobile Application to help users discover personalised games based on rubric scoring and accessibility preferences<br>
    
   <br />
   <br />
   <a href="https://youtu.be/t7LZq0_ATSo">View Demo</a>
    ·
    <a href="https://github.com/Tsebo200/SRG-ReactNative-Expo/issues">Report Bug</a>
    ·
    <a href="https://github.com/Tsebo200/SRG-ReactNative-Expo/issues">Request Feature</a>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

* [About the Project](#about-the-project)
  * [Project Description](#project-description)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [How to install](#how-to-install)
* [Features and Functionality](#features-and-functionality)
* [Concept Process](#concept-process)
   * [Ideation](#ideation)
   * [Wireframes](#wireframes)
   * [Custom UI](#custom-ui)
   * [User Flow](#user-flow)
* [Development Process](#development-process)
   * [Implementation Process](#implementation-process)
        * [Highlights](#highlights)
        * [Challenges](#challenges)
   * [Future Implementation](#future-implementation)
* [Final Outcome](#final-outcome)
    * [Mockups](#mockups)
    * [Video Demonstration](#video-demonstration)
* [Conclusion](#conclusion)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)

<!--PROJECT DESCRIPTION-->

## About the Project

### Project Description

An AI-powered game recommendation mobile application built with Expo Go that uses rubric-driven scoring (Completeness, Monetisation, Accessibility, Creativity) to provide personalised game recommendations. The app integrates with gaming platforms (Steam), intended for integration with Xbox, PSN, & Nintendo as well, and features an accessibility-first design with WCAG AA/AAA compliance, colour vision modes, speech-to-text, and haptic feedback.

### Built With

The REFTSGO Stack

* React Native [<img src="https://i0.wp.com/everyday.codes/wp-content/uploads/2019/06/react-native-1024x631-1024x631.png?resize=680%2C419&ssl=1" width="7%" height="7%">](https://reactnative.dev/)

* Expo Go [<img src="https://avatars.githubusercontent.com/u/12504344?v=4" width="7%" height="7%">](https://expo.dev/go)

* Firebase [<img src="https://vectorseek.com/wp-content/uploads/2025/05/Firebase-icon-Logo-PNG-SVG-Vector.png" width="7%" height="7%">](https://firebase.google.com)

* TypeScript [<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Typescript.svg/1200px-Typescript.svg.png" width="7%" height="7%">](https://www.typescriptlang.org/)

* Supabase [<img src="https://logo.svgcdn.com/logos/supabase-icon.png" width="7%" height="7%">](https://supabase.com)

* Go (Golang) [<img src="https://go.dev/images/go-logo-blue.svg" width="7%" height="7%">](https://go.dev/)
  
* OpenAi (GPT Turbo 3.5) [<img src="https://us1.discourse-cdn.com/openai1/original/4X/3/2/1/321a1ba297482d3d4060d114860de1aa5610f8a9.png" width="7%" height="7%">](https://go.dev/)

<!-- GETTING STARTED -->

## Getting Started

The following instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure that you have the latest version of [NPM](https://www.npmjs.com/) and [Node.js](https://nodejs.org/) (>=18) installed on your machine. The [GitHub Desktop](https://desktop.github.com/) program will also be required. Additionally, you'll need:

- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g @expo/cli`
- [Go 1.22+](https://go.dev/dl/) (for backend)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local database)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### How to install

### Installation

Here are a couple of ways to clone this repo:

1. **GitHub Desktop** </br>
Enter `https://github.com/Tsebo200/SRG-ReactNative-Expo.git` into the URL field and press the `Clone` button.

2. **Clone Repository** </br>
Run the following in the command line to clone the project:

   ```sh
   git clone https://github.com/Tsebo200/SRG-ReactNative-Expo.git
   ```

3. **Install Dependencies** </br>
Run the following in the command line to install all the required dependencies:

   ```sh
   cd frontend/SRG
   npm install
   ```

   For backend:
   ```sh
   cd backend
   go mod tidy
   ```

4. **Environment Variables**

Create a `.env` file in the `frontend/SRG` directory and place the following variables:

```sh
# API Keys
RAWG_API_KEY=your_rawg_api_key
GOOGLE_CLOUD_SPEECH_API_KEY=your_google_cloud_speech_api_key

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
BACKEND_URL=http://localhost:8080
```

5. **Setup Supabase (Local)**

```bash
supabase start
supabase migration up
```

6. **Start Backend Server**

```bash
cd backend
go run ./cmd/server
```

7. **Start Frontend**

```bash
cd frontend/SRG
npx expo start
```

<!-- FEATURES AND FUNCTIONALITY-->

## Features and Functionality

### Home Screen
- Welcome screen with animated background bubbles
- Quick access to game recommendations
- AI-powered game suggestions based on user preferences

### Search Screen
- **Debounced Search**: Real-time game search with RAWG API integration
- **Voice Search**: Press-and-hold microphone button with Google Cloud Speech-to-Text
- **Privacy Controls**: Microphone consent toggle in privacy settings
- **Visual Feedback**: "Listening..." indicator during voice recording
- **Swipeable Game Cards**: Swipe right to add to favourites, swipe left to remove
- **Game Details**: Tap any game to view full details, including description, genres, release date, and platforms

### For You (Recommendations) Screen
- **AI Recommendations**: Personalised game recommendations based on:
  - SSG rubric scores (Completeness, Monetisation, Accessibility, Creativity)
  - User preferences and favourite games
  - Steam account integration (optional)
- **Steam Integration**: 
  - Link your Steam account to get recommendations based on your library
  - Privacy toggle to control Steam data influence
  - Scrollable Steam recommendations section
- **Favourites-Based Recommendations**: Games recommended based on your favourite games
- **Animated Background**: Decorative bubbles for visual appeal

### Favourites Screen
- **Favourite Games List**: View all your favourited games
- **Image Fallback**: Automatic image fetching for games missing cover art
- **Game Details**: Tap any game to view full details
- **Remove Favourites**: Long-press or swipe to remove games from favourites
- **Offline Support**: Favourites stored locally with hybrid persistence (AsyncStorage + Supabase)

### Game Details Screen
- **Full Game Information**: 
  - Game title and description
  - Release date
  - Game type (genres)
  - Platforms
  - Metacritic rating
- **Favourite Toggle**: Add or remove games from favourites
- **Rich Content**: Game cover images and detailed descriptions from the RAWG API

### Profile Screen
- **User Profile Management**:
  - Editable username (tap profile card to edit)
  - Avatar selection with DiceBear integration
  - Success sound feedback on profile updates
- **Steam Account Integration**:
  - Link/unlink Steam account
  - Haptic and sound feedback for Steam actions
- **Privacy Settings**:
  - Microphone consent toggle
  - Steam data influence toggle
  - Control what data is used for recommendations
- **Theme Selection**:
  - Light mode, dark mode, and custom themes
  - Colour vision modes (protanopia, deuteranopia, tritanopia, achromatopsia)
  - High contrast mode
  - Accessibility options (reduce motion, large text)
- **Accessibility Settings**:
  - Colour theme selector
  - Accessibility options toggle
- **Logout**: Sign out securely with Firebase Auth

### Onboarding Screen
- **Welcome Flow**: First-time user experience
- **User Preferences**: Collect initial preferences for personalised recommendations

### Authentication
- **Firebase Authentication**: Secure user authentication
- **Login Screen**: Email/password authentication with error handling
- **Register Screen**: New user registration with validation

### Hybrid Data Persistence
- **AsyncStorage**: Local storage for offline support
- **Supabase**: Cloud database for synchronization
- **Firebase**: User authentication and preferences
- **Automatic Sync**: Seamless data synchronisation between local and cloud storage

### Accessibility Features
- **WCAG 2.2 AA/AAA Compliance**: Built-in accessibility standards
- **Color Vision Modes**: Support for various color vision deficiencies
- **Text-to-Speech**: Voice feedback for actions
- **Speech-to-Text**: Voice search functionality
- **Haptic Feedback**: Tactile feedback for interactions
- **Large Hit Targets**: Easy-to-tap buttons and controls
- **Reduce Motion**: Toggle to disable animations
- **High Contrast Mode**: Enhanced visibility for low vision users

<!-- CONCEPT PROCESS -->

## Concept Process

The `Conceptual Process` is the set of actions, activities and research that were done when starting this project.

Gamers often struggle to find games that match their preferences, especially those with accessibility needs or specific requirements (e.g., no pay-to-win, strong accessibility support). Existing recommendation systems don't prioritise accessibility or use rubric-based scoring.

The aim of the app is to provide personalised game recommendations using AI-powered rubric scoring (Completeness, Monetisation, Accessibility, Creativity) while ensuring the app itself is accessible to all users, including those with colour vision deficiencies, hearing impairments, or motor disabilities.

### Ideation

The stylistic choice was going for a fresh and modern look with liquid glass UI effects, beautiful gradients, and smooth animations. The app emphasises accessibility while maintaining a visually appealing and fun gaming experience. The colour palette is designed to work across multiple colour vision modes, and interactions are designed to be intuitive with gesture-driven controls.

### Wireframes

Wireframes were created in Figma during the initial planning phase, focusing on:
- Tab-based navigation structure
- Game card layouts for recommendations and search
- Profile and settings screens
- Accessibility options placement

### Custom UI

The UI is unique and heavily customised to accommodate:
- **Gesture-Driven Interactions**: Swipeable cards for favourites management
- **Press-and-Hold Actions**: Microphone button for voice search
- **Animated Backgrounds**: Decorative bubbles for visual appeal
- **Liquid Glass Effects**: Blur effects and gradients using expo-blur and expo-linear-gradient
- **Accessibility-First Design**: Colour themes, contrast modes, and reduced motion options

### User Flow

The app follows a tab-based navigation structure:
1. **Home** → Welcome screen with quick access
2. **Search** → Voice/text search for games
3. **For You** → AI-powered recommendations
4. **Favourites** → Saved games list
5. **Profile** → User settings and preferences

User can navigate between tabs, search for games, add favourites, view game details, and customise their experience through the profile screen.

<!-- DEVELOPMENT PROCESS -->

## Development Process

The `Development Process` is the technical implementation and functionality done in the frontend and backend of the application.

### Implementation Process

* **Frontend**: React Native with Expo SDK 54
* **Backend**: Go (Golang) with chi router and OpenAPI support
* **Database**: Supabase (PostgreSQL with pgvector for embeddings)
* **Authentication**: Firebase Auth with hybrid persistence
* **State Management**: React hooks (useState, useEffect) with AsyncStorage for persistence
* **Navigation**: Expo Router for file-based routing
* **API Integration**: RAWG API for game data, Google Cloud Speech-to-Text for voice search
* **TypeScript**: Full type safety throughout the application
* **Accessibility**: Custom theme system with colour vision modes and WCAG compliance

### Data Flow Diagram

#### Planned

The initial architecture planned for:
- Firebase for authentication
- Supabase for game data and embeddings
- Local storage for offline support
- Go backend for API proxying and rate limiting

#### Final

##### Firebase Collections

- **users**: User authentication data
- **favourites**: User-favoured games (synced with Supabase)

##### Supabase Tables

- **games**: Game data with embeddings
- **favourites**: User-favoured games (synced with Firebase)
- **user_preferences**: User preferences and settings

##### Hybrid Storage

- **AsyncStorage**: Local storage for offline support
- **Firebase**: Real-time authentication and preferences
- **Supabase**: Cloud database with vector embeddings

### Highlights

I think it was a good decision to start off the project with the search and favourites functionality, as this provided the core user experience early on.

I was excited when I got the voice search working with Google Cloud Speech-to-Text, especially after resolving the encoding and sample rate issues for different platforms.

Once I got the hybrid persistence working (AsyncStorage + Supabase + Firebase), I felt like this was coming together as an actual production-ready app.

The accessibility features implementation, including colour vision modes and WCAG compliance, was particularly rewarding as it makes the app usable for a wider audience.

The Steam integration for personalised recommendations based on users' libraries was a great addition that enhances the recommendation quality.

### Challenges

I initially struggled with the Google Cloud Speech-to-Text integration due to encoding and sample rate mismatches between Expo's audio recording and Google's API expectations. This was resolved by implementing platform-specific audio recording presets (AMR_NB for Android, Linear PCM for iOS).

The hybrid persistence (AsyncStorage + Supabase + Firebase) required careful synchronisation logic to ensure data consistency across all storage layers.

Implementing accessibility features while maintaining visual appeal required extensive testing across different colour vision modes and accessibility settings.

The image fallback system for games missing cover art required additional API calls and careful state management to prevent performance issues.

### Future Implementation

- **Notifications**: Firebase Cloud Messaging for game updates and recommendations
- **Enhanced AI Recommendations**: Improved embedding-based similarity matching
- **QR Code Scanner**: Integration with SkyScansGames for game data transfer
- **Maps Integration**: Visual representation of game availability
- **Social Features**: Share recommendations with friends
- **Advanced Filtering**: Filter recommendations by genre, platform, and rubric scores
- **Game Reviews**: User reviews and ratings system
- **Wishlist Notifications**: Notify users when wishlisted games go on sale
- **Offline Mode**: Full offline functionality with sync when online
- **Analytics Dashboard**: Track recommendation accuracy and user engagement

<!-- MOCKUPS -->

## Final Outcome

### Mockups

The app features a modern, accessible design with:
- **Liquid Glass UI**: Beautiful blur effects and gradients
- **Animated Backgrounds**: Decorative bubbles for visual appeal
- **Swipeable Cards**: Intuitive gesture-driven interactions
- **Accessibility-First**: Colour themes and contrast modes for all users
- **Responsive Layout**: Works seamlessly on iOS and Android

### Video Demonstration

To see a run-through of the application, click below:

[View Demonstration](https://youtu.be/t7LZq0_ATSo)

See the [open issues](https://github.com/Tsebo200/SRG-ReactNative-Expo/issues) for a list of proposed features (and known issues).

<!-- AUTHORS -->

## Author

* **Tsebo Ramonyalioa** - [Tsebo200](https://github.com/Tsebo200)

<!-- LICENSE -->

## License

Copyright (c) 2025 CreativeT by Tsebo Ramonyalioa

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

See: https://creativecommons.org/licenses/by-nc/4.0/

SPDX: CC-BY-NC-4.0

BY: credit must be given to the creator.

NC: Only noncommercial uses of the work are permitted.

For commercial use or licensing, please use the contact details below.

<!-- CONTACT -->

## Contact

* **Tsebo Ramonyalioa** - [tsebo.ramonyalioa.an@gmail.com](mailto:tsebo.ramonyalioa.an@gmail.com) - [inspiration__200](https://www.instagram.com/inspiration__200/) 

* **Project Link** - https://github.com/Tsebo200/SRG-ReactNative-Expo

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

* [Lecturer](https://github.com/Armand-OW)

* [Avatar Picker](https://www.dicebear.com/)

* [Expo](https://expo.dev/)

* [React Native](https://reactnative.dev/)

* [RAWG API](https://rawg.io/apidocs)

* [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)

* [Supabase](https://supabase.com/)

* [Firebase](https://firebase.google.com/)

* [YouTube](https://www.youtube.com/)

* [Sound Effects](https://freesound.org/)

I am grateful to the [open-source community](https://reactnative.directory/) and the platforms above for the tools and guidance that made this project possible.
