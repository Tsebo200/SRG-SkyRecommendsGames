# Frontend Commands

## 🚀 Start Frontend

### From Root Directory:
```bash
cd frontend/SRG
npm start
```

### From Frontend Directory:
```bash
npm start
```

## 🛑 Stop Frontend

### Option 1: Using npm script (Recommended)
```bash
# From root directory
npm run stop:frontend

# From frontend directory
npm run stop
```

### Option 2: Using script directly
```bash
bash scripts/stop-frontend.sh
```

### Option 3: Manual process kill
```bash
# Kill Expo processes
pkill -f "expo start"

# Kill processes on Expo ports
lsof -ti:8081 | xargs kill
lsof -ti:8082 | xargs kill
lsof -ti:8083 | xargs kill
```

## 🔄 Restart Frontend

```bash
# Stop and start
npm run stop:frontend
cd frontend/SRG
npm start
```

## 📱 Frontend Development

### Start with specific platform:
```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

### Start with clear cache:
```bash
npm start -- --clear
```

## 🧪 Testing

```bash
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

## 🔧 Troubleshooting

### If frontend won't start:
1. Stop all processes: `npm run stop:frontend`
2. Clear cache: `npm start -- --clear`
3. Check ports: `lsof -i :8081`

### If ports are busy:
```bash
# Find process using port
lsof -i :8081

# Kill specific process
kill -9 <PID>
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run stop` | Stop frontend server |
| `npm run android` | Start for Android |
| `npm run ios` | Start for iOS |
| `npm run web` | Start for Web |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
