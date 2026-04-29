# 🎓 AI Personal Assistant for Students - Project Overview

## 📋 What You Have

A complete web application for students featuring an AI-style chat experience, note‑taking, task management, and study planning.  
**All data is stored locally in the browser using localStorage.**

### ✨ Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🔐 Authentication | Signup/login stored locally | ✅ Complete |
| 💬 AI Chat | Gemini responses + history | ✅ Complete |
| 📝 Notes Manager | Create, edit, delete notes | ✅ Complete |
| ✓ To-Do List | Manage tasks with status | ✅ Complete |
| 📅 Study Planner | Plan study sessions + calendar | ✅ Complete |
| 🌙 Dark Mode | Beautiful theme toggle | ✅ Complete |
| 📱 Responsive | Works on mobile/desktop | ✅ Complete |
| 🎙️ Voice Input | Dictate chat messages | ✅ Complete |
| 🕒 Live Clock | Real-time clock in sidebar | ✅ Complete |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install
```bash
npm install
```

### Step 2: Start
```bash
npm start
# Open http://localhost:3000
```

### Step 3: Use the App
Create an account, then try Chat, Notes, Todos, and Schedule.

---

## 🔌 Technology Stack

### Frontend
- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **localStorage** for persistence

### Backend
- **Node.js**
- **Express.js** (static file server + Gemini proxy)

---

## 💾 Local Storage Keys

- `users` – registered accounts  
- `user` – current signed‑in user  
- `notes:<userId>` – notes list  
- `todos:<userId>` – tasks list  
- `schedule:<userId>` – study schedule  
- `chatHistory:<userId>` – chat history  

---

## 🎨 UI/UX Features

- Smooth animations
- Loading spinners
- Dark mode toggle
- Responsive layout

---

## ✅ Status

The project is ready to run locally with no database setup.
