#!/bin/bash

# TRESR Theme Backend URL Update Script
# Updates all references from localhost to production Railway URL

echo "🔄 TRESR Theme Backend URL Update"
echo "================================="

# Configuration
THEME_DIR="/Users/user/Documents/TRESR Shopify/tresr-vibes-theme"
OLD_URL="http://localhost:3001"
NEW_URL="${1:-https://vibes.tresr.com}"

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: ./update-theme-backend-url.sh [new-backend-url]"
    echo ""
    echo "Updates all backend URLs in theme files from localhost to production"
    echo ""
    echo "Examples:"
    echo "  ./update-theme-backend-url.sh"
    echo "  ./update-theme-backend-url.sh https://custom-domain.com"
    exit 0
fi

echo "📍 Theme directory: $THEME_DIR"
echo "🔄 Updating from: $OLD_URL"
echo "✅ Updating to: $NEW_URL"
echo ""

# Check if theme directory exists
if [ ! -d "$THEME_DIR" ]; then
    echo "❌ Error: Theme directory not found at $THEME_DIR"
    exit 1
fi

cd "$THEME_DIR"

# Find all files that need updating
echo "🔍 Searching for files containing backend URLs..."
FILES_TO_UPDATE=$(grep -r "$OLD_URL" . --include="*.liquid" --include="*.js" --include="*.json" --exclude-dir="node_modules" -l)

if [ -z "$FILES_TO_UPDATE" ]; then
    echo "✅ No files found with localhost URLs. Already updated?"
    exit 0
fi

echo "📝 Found files to update:"
echo "$FILES_TO_UPDATE" | while read file; do
    echo "  - $file"
done
echo ""

# Create backup
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

echo "$FILES_TO_UPDATE" | while read file; do
    if [ -f "$file" ]; then
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
    fi
done

# Update files
echo "🔧 Updating backend URLs..."
echo "$FILES_TO_UPDATE" | while read file; do
    if [ -f "$file" ]; then
        # Use sed to replace URLs
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$OLD_URL|$NEW_URL|g" "$file"
        else
            # Linux
            sed -i "s|$OLD_URL|$NEW_URL|g" "$file"
        fi
        echo "  ✓ Updated: $file"
    fi
done

# Verify changes
echo ""
echo "🔍 Verifying changes..."
REMAINING=$(grep -r "$OLD_URL" . --include="*.liquid" --include="*.js" --include="*.json" --exclude-dir="node_modules" -l | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All URLs successfully updated!"
else
    echo "⚠️  Warning: $REMAINING files still contain localhost URLs"
fi

# Show what changed
echo ""
echo "📋 Summary of changes:"
echo "$FILES_TO_UPDATE" | while read file; do
    if [ -f "$file" ]; then
        echo ""
        echo "File: $file"
        echo "Changes:"
        diff "$BACKUP_DIR/$file" "$file" | grep "^[<>]" | head -10
    fi
done

# Ask to deploy
echo ""
echo "🚀 Ready to deploy theme changes?"
echo ""
echo "To deploy to Shopify, run:"
echo "  shopify theme push --theme=179671597341 --allow-live"
echo ""
echo "To deploy specific files only:"
echo "  shopify theme push --theme=179671597341 --only $(echo $FILES_TO_UPDATE | tr '\n' ' ') --allow-live"
echo ""
echo "💡 Backup created at: $BACKUP_DIR"
echo "   To restore: cp -r $BACKUP_DIR/* ."