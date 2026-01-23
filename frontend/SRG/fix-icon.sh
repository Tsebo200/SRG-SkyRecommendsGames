#!/bin/bash
# Script to fix iOS app icon
# Resizes to 1024x1024 and removes transparency

set -e

echo "🔧 Fixing iOS App Icon..."

ICON_SOURCE="./assets/Sky-Logo.png"
ICON_OUTPUT="./assets/app-icon-1024.png"

if [ ! -f "$ICON_SOURCE" ]; then
  echo "❌ Error: Icon file not found: $ICON_SOURCE"
  exit 1
fi

echo "📐 Resizing icon to 1024x1024 and removing transparency..."

# Check if sips (macOS) is available
if command -v sips &> /dev/null; then
  echo "Using sips (macOS)..."
  # Resize to 1024x1024
  sips -z 1024 1024 "$ICON_SOURCE" --out "$ICON_OUTPUT" > /dev/null 2>&1
  
  # Remove transparency by compositing on white background
  sips -s format png -s formatOptions normal "$ICON_OUTPUT" --out "$ICON_OUTPUT" > /dev/null 2>&1
  
  echo "✅ Icon fixed: $ICON_OUTPUT"
  echo ""
  echo "Next steps:"
  echo "1. Update app.json to use: ./assets/app-icon-1024.png"
  echo "2. Rebuild the app"
  
elif command -v convert &> /dev/null; then
  echo "Using ImageMagick..."
  # Resize and remove transparency
  convert "$ICON_SOURCE" -resize 1024x1024 -background white -alpha remove -alpha off "$ICON_OUTPUT"
  
  echo "✅ Icon fixed: $ICON_OUTPUT"
  echo ""
  echo "Next steps:"
  echo "1. Update app.json to use: ./assets/app-icon-1024.png"
  echo "2. Rebuild the app"
  
else
  echo "❌ Error: No image processing tool found (sips or ImageMagick)"
  echo ""
  echo "Please install ImageMagick:"
  echo "  brew install imagemagick"
  echo ""
  echo "Or manually:"
  echo "1. Open Sky-Logo.png in an image editor"
  echo "2. Resize to exactly 1024 x 1024 pixels"
  echo "3. Remove transparency (add white background)"
  echo "4. Save as app-icon-1024.png"
  exit 1
fi
