# Complete Installation Guide

Detailed setup instructions for all operating systems.  
**No database required** — all data is stored in your browser’s localStorage.

## 📋 Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] VS Code or any code editor

Optional for AI chat:
- [ ] Gemini API key in `.env` (`GEMINI_API_KEY=...`)

---

## 🖥️ Installation by Operating System

### Windows

#### 1️⃣ Install Node.js
1. Visit https://nodejs.org/
2. Download LTS version
3. Run installer, follow prompts
4. Choose "Add to PATH" (important!)
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### 2️⃣ Setup Application
1. Open Command Prompt or PowerShell
2. Navigate to project:
   ```bash
   cd "path\to\AI Personal Assistant for Students"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. (Optional) Create `.env`:
   ```bash
   copy .env.example .env
   ```
5. Start server:
   ```bash
   npm start
   ```

---

### macOS

#### 1️⃣ Install Node.js
Using Homebrew (easiest):
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version
npm --version
```

Or download from https://nodejs.org/

#### 2️⃣ Setup Application
```bash
# Navigate to project
cd path/to/AI\ Personal\ Assistant\ for\ Students

# Install dependencies
npm install

# (Optional) Create .env
cp .env.example .env

# Start server
npm start
```

---

### Linux (Ubuntu/Debian)

#### 1️⃣ Install Node.js
```bash
# Update package manager
sudo apt update

# Install Node.js
sudo apt install nodejs npm

# Verify
node --version
npm --version
```

#### 2️⃣ Setup Application
```bash
# Navigate to project
cd "path/to/AI Personal Assistant for Students"

# Install dependencies
npm install

# (Optional) Create .env
cp .env.example .env

# Start server
npm start
```

---

## ✅ Verify It’s Running

Open your browser:
```
http://localhost:3000
```

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm start
```

### Data not saving
Make sure your browser allows localStorage and you’re not in private browsing mode.

### "Cannot find module" error
```bash
npm install
```

---

## 🎉 You’re Ready!

Create an account, then explore Chat, Notes, Todos, and Schedule.
