# API Documentation

This project runs fully in the browser with **localStorage** and only exposes a minimal AI endpoint.

## ✅ AI Chat Endpoint

**POST** `/api/chat/send`

Request:
```json
{
  "message": "How do I study for exams?"
}
```

Response:
```json
{
  "reply": "Here are some effective study tips..."
}
```

Requirements:
- Set `GEMINI_API_KEY` in `.env`

## ✅ Local Storage Keys

- `users`
- `user`
- `notes:<userId>`
- `todos:<userId>`
- `schedule:<userId>`
- `chatHistory:<userId>`

If you need a full backend later, you can reintroduce routes and a database, but it’s not required for this local‑mode version.
