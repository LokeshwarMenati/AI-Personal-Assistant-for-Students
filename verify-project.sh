#!/bin/bash
# Verification Script - Check if all project files exist

echo "🔍 AI Personal Assistant for Students - Project Verification"
echo "=============================================================="
echo ""

PROJECT_DIR="."
FILES=(
    # Configuration files
    "package.json"
    ".env"
    ".env.example"
    ".gitignore"
    ".vscode/settings.json"

    # Documentation
    "README.md"
    "QUICK_START.md"
    "INSTALLATION_GUIDE.md"
    "API_DOCUMENTATION.md"

    # Database
    "server/sql/schema.sql"

    # Backend - Server
    "server/server.js"
    "server/db.js"

    # Backend - Middleware
    "server/middleware/auth.js"

    # Backend - Routes
    "server/routes/auth.js"
    "server/routes/chat.js"
    "server/routes/user.js"

    # Backend - Controllers
    "server/controllers/index.js"

    # Frontend - HTML
    "public/index.html"
    "public/dashboard.html"

    # Frontend - CSS
    "public/css/styles.css"

    # Frontend - JavaScript
    "public/js/auth.js"
    "public/js/dashboard.js"
    "public/js/chat.js"
)

MISSING=0
FOUND=0

echo "Checking files..."
echo ""

for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "✅ $file"
        ((FOUND++))
    else
        echo "❌ $file (MISSING)"
        ((MISSING++))
    fi
done

echo ""
echo "=============================================================="
echo "Summary:"
echo "✅ Found: $FOUND files"
echo "❌ Missing: $MISSING files"
echo ""

if [ $MISSING -eq 0 ]; then
    echo "🎉 All files are present!"
    echo ""
    echo "Next steps:"
    echo "1. npm install"
    echo "2. Set up MySQL database (see INSTALLATION_GUIDE.md)"
    echo "3. Configure .env file"
    echo "4. npm start"
    echo ""
    echo "Then open: http://localhost:3000"
else
    echo "⚠️  Please check missing files!"
fi
