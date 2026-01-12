# Starting the App from SRG Directory

The app is now configured to run from the `frontend/SRG/` directory, just like it worked before.

## Quick Start

```bash
cd frontend/SRG
npm start
```

## Available Commands

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start on web
- `npm test` - Run tests

## Directory Structure

All app code is in `frontend/SRG/`:
- `app/` - Expo Router app directory
- `lib/` - Library files
- `components/` - React components
- `assets/` - Images and other assets
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration

## Notes

- The app runs from `frontend/SRG/` directory
- All paths in `app.json` are relative to the SRG directory
- Node modules will be installed in `frontend/SRG/node_modules/`
