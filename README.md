# AI Personal Assistant for Students 🤖📚

A complete production-ready web application for students to access an AI study assistant, manage notes, organize tasks, and plan study sessions.

## 🌟 Features

- **🔐 Secure Authentication**
  - Student registration and login
  - Local storage-based authentication
  - Simple client-side validation

- **💬 AI Chat Assistant**
  - Ask academic questions
  - Gemini-powered responses
  - Chat history saved in local storage
  - Clear chat history anytime

- **📝 Notes Manager**
  - Create, edit, and delete notes
  - Notes saved in local storage
  - Responsive note card layout

- **✓ To-Do List**
  - Add and manage tasks
  - Mark tasks as completed
  - Set due dates for tasks
  - Delete tasks

- **📅 Study Planner**
  - Schedule study sessions
  - Organize by subject
  - Set start and end times
  - Add notes to sessions
  - Full calendar view

- **🕒 Live Clock**
  - Real-time clock in the sidebar

- **🎙️ Voice Input**
  - Dictate messages directly into chat

- **🎨 Modern UI/UX**
  - Dark mode toggle
  - Responsive design (mobile, tablet, desktop)
  - Smooth animations
  - Professional styling
  - Loading indicators

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- VS Code (recommended)

## 🚀 Setup Instructions

### 1. App Setup

1. **Navigate to project root**:
   ```bash
   cd "AI Personal Assistant for Students"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** in the project root (optional):
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env`** (edit with VS Code if you want AI chat or a different port):
   ```
   PORT=3000
   NODE_ENV=development
   GEMINI_API_KEY=your_api_key_here
   ```

5. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   ╔════════════════════════════════════════╗
   ║   AI Personal Assistant for Students   ║
   ║          Server Started                ║
   ║         Port: 3000                     ║
   ║    http://localhost:3000               ║
   ╚════════════════════════════════════════╝
   ```

### 2. Access the Application

1. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

2. **Create an account**:
   - Click "Sign Up"
   - Enter your name, email, and password
   - Click "Create Account"

3. **Login**:
   - Go back to "Sign In"
   - Enter your credentials
   - Click "Sign In"

## 📁 Project Structure

```
AI Personal Assistant for Students/
│
├── public/                          # Frontend files (served by Express)
│   ├── index.html                  # Login & Register page
│   ├── dashboard.html              # Main dashboard
│   ├── css/
│   │   └── styles.css              # All styles with dark mode
│   └── js/
│       ├── auth.js                 # Authentication logic
│       ├── dashboard.js            # Dashboard functionality
│       └── chat.js                 # Chat interface logic
│
├── server/                          # Backend files
│   └── server.js                   # Express static server
│
├── package.json                     # Node dependencies
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

## 💾 Local Storage

All data is stored in the browser using localStorage. Each user’s data is isolated by user ID:

- `users` – registered accounts
- `user` – current signed-in user
- `notes:<userId>` – notes list
- `todos:<userId>` – tasks list
- `schedule:<userId>` – study schedule
- `chatHistory:<userId>` – chat history

## 🛡️ Security Features

✅ **Local-only Authentication**: Credentials stored in localStorage  
✅ **Input Validation**: Client-side validation  
✅ **XSS Protection**: HTML escaping in frontend  
✅ **No Server Secrets**: Static server only  

## 🎨 UI Features

- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Loading Spinners**: Visual feedback during actions
- **Animations**: Smooth transitions and interactions
- **Error Handling**: User-friendly error messages
- **Accessibility**: Semantic HTML and keyboard navigation

## 🧪 Testing the Application

### Create a Test Account
```
Email: test@example.com
Password: Test@123
Name: Test Student
```

### Test Each Feature

1. **Chat**: Ask "hello" or "help" to the AI assistant
2. **Notes**: Create a note with title and content
3. **Todos**: Add tasks and mark them as completed
4. **Schedule**: Create a study session for tomorrow

## 🔧 Troubleshooting

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change PORT in `.env` or kill the process using port 3000

### "Cannot find module" Error
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` to install all dependencies

## 📝 Environment Variables

```bash
PORT=3000                           # Server port
NODE_ENV=development                # Environment mode
```

### Google OAuth (Production)

To enable Google Sign-In in production, register an OAuth client in the Google Cloud Console and add the resulting credentials to your server environment.

1. Create a Google Cloud project and configure the OAuth consent screen (external or internal depending on your users).
2. Create Credentials → OAuth 2.0 Client IDs → Web application.
3. Set the **Authorized redirect URI** to your production callback URL, for example:

```
https://your-production-domain.com/api/auth/google/callback
```

4. Add the following environment variables to your server (example `.env`):

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-production-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-production-domain.com
JWT_SECRET=replace_with_a_long_random_secret
USE_HTTP_ONLY_COOKIE_FOR_JWT=true   # recommended for production
NODE_ENV=production
```

5. Restart the server and test the flow by visiting your site and clicking "Sign in with Google". When `USE_HTTP_ONLY_COOKIE_FOR_JWT` is set to `true`, the server will set a secure, HttpOnly cookie (`sb_token`) instead of exposing the JWT in the URL.

Security notes:
- Use HTTPS in production (required by Google for OAuth redirect URIs).
- Keep `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` confidential and store them in your deployment platform's secret manager (do not commit to source control).
- Using an HttpOnly cookie mitigates XSS token theft; ensure CSRF protections and SameSite settings are appropriate for your deployment.

## 🚀 Deployment Ready

This application is production-ready with:
- Error handling and logging
- Environment-based configuration
- Local storage persistence
- Simple static server deployment

To deploy:
1. Change `NODE_ENV` to `production`
2. Use a process manager like PM2
3. Set up reverse proxy (Nginx/Apache)
4. Enable HTTPS

## 📚 Learning Resources

- [Express.js Documentation](https://expressjs.com)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Responsive CSS Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## 📄 License

This project is open source and available under the MIT License.

## 💡 Future Enhancements

- [ ] Real OpenAI/Claude API integration
- [ ] File upload support for notes
- [ ] Real-time chat with WebSockets
- [ ] Video call feature
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Social sharing features
- [ ] Advanced analytics
- [ ] User preferences/settings
- [ ] Two-factor authentication

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Check browser console for errors
3. Check environment variables

---

**Happy Learning! 📖✨**

Built with ❤️ for students
#   A I - P e r s o n a l - A s s i s t a n t - f o r - S t u d e n t s  
 