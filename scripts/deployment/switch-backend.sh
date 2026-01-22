#!/bin/bash

# Script to switch between local and production backend URLs

ENV_FILE="frontend/SRG/.env"
BACKUP_FILE="frontend/SRG/.env.backup"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Backend URL Switcher${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating new one...${NC}"
    mkdir -p frontend/SRG
    touch "$ENV_FILE"
fi

# Backup current .env
cp "$ENV_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
echo ""

# Show current setting
if grep -q "EXPO_PUBLIC_BACKEND_URL" "$ENV_FILE"; then
    CURRENT_URL=$(grep "EXPO_PUBLIC_BACKEND_URL" "$ENV_FILE" | cut -d '=' -f2)
    echo -e "Current backend URL: ${YELLOW}$CURRENT_URL${NC}"
else
    echo -e "Current backend URL: ${YELLOW}Not set${NC}"
fi

echo ""
echo "Select backend mode:"
echo "1) Local development (localhost or local IP)"
echo "2) Production (public URL)"
echo "3) Custom URL"
echo "4) View current setting"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        # Get current local IP
        CURRENT_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}')
        
        echo ""
        echo "Select local backend:"
        echo "1) localhost:8080 (same device/emulator)"
        echo "2) $CURRENT_IP:8080 (current network IP)"
        read -p "Enter choice [1-2]: " local_choice
        
        if [ "$local_choice" == "1" ]; then
            NEW_URL="http://localhost:8080"
        else
            NEW_URL="http://$CURRENT_IP:8080"
        fi
        ;;
    2)
        read -p "Enter your production backend URL (e.g., https://your-app.railway.app): " NEW_URL
        if [ -z "$NEW_URL" ]; then
            echo -e "${YELLOW}⚠️  No URL provided. Exiting.${NC}"
            exit 1
        fi
        # Ensure it starts with http:// or https://
        if [[ ! "$NEW_URL" =~ ^https?:// ]]; then
            NEW_URL="https://$NEW_URL"
        fi
        ;;
    3)
        read -p "Enter custom backend URL: " NEW_URL
        if [ -z "$NEW_URL" ]; then
            echo -e "${YELLOW}⚠️  No URL provided. Exiting.${NC}"
            exit 1
        fi
        ;;
    4)
        if grep -q "EXPO_PUBLIC_BACKEND_URL" "$ENV_FILE"; then
            echo ""
            echo -e "${GREEN}Current backend URL:${NC}"
            grep "EXPO_PUBLIC_BACKEND_URL" "$ENV_FILE"
        else
            echo -e "${YELLOW}No backend URL set in .env file${NC}"
        fi
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Update .env file
if grep -q "EXPO_PUBLIC_BACKEND_URL" "$ENV_FILE"; then
    # Update existing entry
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=$NEW_URL|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=$NEW_URL|" "$ENV_FILE"
    fi
else
    # Add new entry
    echo "" >> "$ENV_FILE"
    echo "EXPO_PUBLIC_BACKEND_URL=$NEW_URL" >> "$ENV_FILE"
fi

echo ""
echo -e "${GREEN}✅ Backend URL updated to: $NEW_URL${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to restart your Expo development server for changes to take effect:${NC}"
echo "   cd frontend/SRG && npm start"
echo ""
