# SRG Project Port Configuration

## 🎯 **OFFICIAL PORT ASSIGNMENTS**

### **Backend (Go Server)**
- **Port**: `8080` (FIXED)
- **URL**: `http://localhost:8080`
- **Health Check**: `http://localhost:8080/health`
- **API Base**: `http://localhost:8080`
- **Configuration**: Set via `PORT` environment variable (defaults to 8080)

### **Frontend (Expo Metro)**
- **Port**: `8081` (FIXED)
- **URL**: `http://localhost:8081`
- **Development Server**: Metro bundler
- **Configuration**: Expo automatically uses 8081

### **Database (Supabase)**
- **Port**: `54322` (FIXED)
- **URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Configuration**: Supabase local development

## 📋 **Environment Variables**

### **Backend (.env)**
```env
PORT=8080
RAWG_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

### **Frontend (.env)**
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
```

## 🚀 **Starting Services**

### **1. Start Backend (Port 8080)**
```bash
cd backend
go run ./cmd/server
# Server starts on http://localhost:8080
```

### **2. Start Frontend (Port 8081)**
```bash
cd frontend/SRG
npm start
# Metro bundler starts on http://localhost:8081
```

### **3. Start Database (Port 54322)**
```bash
supabase start
# Database starts on postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 🔧 **Port Verification Commands**

### **Check All Project Ports**
```bash
# Check backend (8080)
lsof -i :8080

# Check frontend (8081)  
lsof -i :8081

# Check database (54322)
lsof -i :54322
```

### **Test Backend Health**
```bash
curl http://localhost:8080/health
```

### **Test Frontend**
```bash
# Open in browser
open http://localhost:8081
```

## ⚠️ **Port Conflict Resolution**

### **If Port 8080 is Busy**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### **If Port 8081 is Busy**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

## 📊 **Service Status Check**

```bash
# Check all project ports at once
lsof -i :8080 -i :8081 -i :54322
```

## 🎯 **Development Workflow**

1. **Start Database**: `supabase start` (Port 54322)
2. **Start Backend**: `cd backend && go run ./cmd/server` (Port 8080)
3. **Start Frontend**: `cd frontend/SRG && npm start` (Port 8081)
4. **Access App**: Open Expo Go app or browser

## 📝 **Notes**

- **NEVER change these port numbers** without updating all configuration files
- **Backend must be on 8080** for frontend API calls to work
- **Frontend must be on 8081** for Expo development
- **Database must be on 54322** for Supabase local development
- All services must be running for full functionality
