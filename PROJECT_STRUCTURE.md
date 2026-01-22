# 📁 Project Structure

## 🎯 Overview

This document describes the **organized and recommended** structure of the SRG React Native Expo project.

---

## 📂 Root Directory Structure

```
SRG-ReactNative-Expo/
├── 📱 frontend/                  # Frontend React Native application
│   └── SRG/                      # Main app directory
│       ├── app/                  # Expo Router pages
│       ├── components/            # React components
│       ├── lib/                  # Libraries and utilities
│       ├── ios/                  # ✅ ACTIVE iOS project
│       ├── android/              # Android project
│       └── package.json          # Frontend dependencies
│
├── 🔧 backend/                    # Backend services
│
├── 📚 docs/                       # All documentation
│   ├── deployment/               # Deployment guides
│   ├── firebase/                  # Firebase setup docs
│   ├── project-setup/            # Project structure docs
│   └── troubleshooting/          # Troubleshooting guides
│
├── 🛠️ scripts/                     # All utility scripts
│   ├── database/                 # SQL migration scripts
│   ├── testing/                  # Test and debug scripts
│   ├── deployment/               # Deployment scripts
│   └── maintenance/              # Maintenance utilities
│
├── 🗄️ database/                   # Database files
│   ├── games.db                  # SQLite database
│   └── seeds/                    # Seed data
│
├── 🗃️ config/                     # Configuration files
│   ├── supabase/                 # Supabase configuration
│   └── firebase/                 # Firebase configuration
│
├── 🗄️ archive/                    # Archived/legacy files
│   └── legacy-ios/               # Old iOS project folders
│
└── 📄 Root config files          # Only essential config
    ├── README.md
    ├── package.json
    ├── .gitignore
    ├── tsconfig.json
    ├── eas.json
    └── PROJECT_STRUCTURE.md
```

---

## ✅ Active Project Locations

### **iOS Project** (USE THIS)
```
frontend/SRG/ios/
├── SRG.xcworkspace              # Open this in Xcode
├── Podfile                      # CocoaPods dependencies
├── Pods/                        # Installed pods
└── SRG/                         # App source
    ├── AppDelegate.swift
    ├── Info.plist
    └── GoogleService-Info.plist
```

### **Android Project**
```
frontend/SRG/android/
```

### **Main App Code**
```
frontend/SRG/
├── app/                         # Expo Router pages
├── components/                  # React components
├── lib/                         # Utilities and services
└── assets/                      # Images, fonts, etc.
```

---

## 🛠️ Scripts Organization

### **Database Scripts** (`scripts/database/`)
- SQL migration files
- Database setup scripts
- Schema definitions

### **Testing Scripts** (`scripts/testing/`)
- `test-*.js` - Test scripts
- `debug-*.js` - Debug utilities
- `verify-*.js` - Verification scripts

### **Deployment Scripts** (`scripts/deployment/`)
- `deploy-*.sh` - Deployment scripts
- `switch-*.sh` - Environment switching
- `update-*.sh` - Update scripts

### **Maintenance Scripts** (`scripts/maintenance/`)
- `create-*.js` - Creation utilities
- `fix-*.js` - Fix/repair scripts
- `import-*.js` - Data import scripts

---

## 📚 Documentation Locations

### **Setup & Configuration**
- `docs/project-setup/` - Project structure and setup
- `docs/firebase/` - Firebase configuration guides

### **Deployment**
- `docs/deployment/` - App Store, EAS, TestFlight guides

### **Troubleshooting**
- `docs/troubleshooting/` - Common issues and solutions

---

## 🗄️ Database Files

### **Location:** `database/`
- `games.db` - SQLite database file
- `seeds/` - Seed data files
- `sample_embeddings.json` - Sample data

---

## 🗃️ Configuration Files

### **Location:** `config/`
- `supabase/` - Supabase configuration
- `firebase/` - Firebase configuration (if needed)

---

## 🗄️ Archived Locations

### **Legacy iOS Folders** (DO NOT USE)
- `archive/legacy-ios/ios-root/` - Old root iOS project
- `archive/legacy-ios/ios-frontend/` - Old frontend iOS project

These are kept for reference but should not be used.

---

## 🚀 Quick Start

### **Build iOS**
```bash
cd frontend/SRG
npx expo run:ios
```

### **Build Android**
```bash
cd frontend/SRG
npx expo run:android
```

### **Start Development Server**
```bash
cd frontend/SRG
npm start
```

### **Run Scripts**
```bash
# Database script
node scripts/database/migration.sql

# Test script
node scripts/testing/test-favourites.js

# Deployment script
./scripts/deployment/deploy-testflight.sh
```

---

## 📝 Important Notes

1. **Only use:** `frontend/SRG/ios/` for iOS development
2. **Ignore:** `archive/legacy-ios/` folders
3. **Documentation:** Check `docs/` for guides
4. **Scripts:** Use `scripts/` for utilities
5. **Database:** Files in `database/` directory
6. **Config:** Centralized in `config/` directory

---

## ✅ Benefits of This Structure

1. **Clean Root** - Only essential config files
2. **Organized Scripts** - Easy to find by category
3. **Centralized Docs** - All documentation in one place
4. **Clear Separation** - Frontend, backend, scripts, docs
5. **Scalable** - Easy to add new files/categories
6. **Professional** - Follows industry best practices

---

**Last Updated:** January 2025
**Structure Version:** 2.0 (Recommended)
