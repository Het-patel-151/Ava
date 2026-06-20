# AVA — AI Voice Assistant

A production-ready full-stack AI Voice Assistant web application with real-time voice conversations, streaming chat, custom AI agents, analytics, and more.

---

## ✨ Features

- 🎙️ **Real-time Voice Assistant** — speak with AI using WebRTC + Whisper + TTS
- 💬 **Streaming Chat** — ChatGPT-style interface with SSE streaming
- 🤖 **Custom AI Agents** — create specialized assistants with custom system prompts
- 📁 **File Upload & Analysis** — PDF, DOCX, images with AI summarization
- 📊 **Analytics Dashboard** — usage charts powered by Recharts
- 🔐 **Full Auth** — JWT, refresh tokens, email verification, OAuth (Google/GitHub)
- 🌙 **Dark/Light/System** theme with glassmorphism UI
- 🐳 **Docker** — single command deployment
- 🚀 **CI/CD** — GitHub Actions with automated deploy

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Socket.IO |
| AI | OpenAI GPT-4o, Whisper (STT), TTS, Realtime API |
| Database | PostgreSQL + Redis |
| Auth | JWT, Refresh Tokens, bcrypt, OAuth |
| DevOps | Docker, Docker Compose, Nginx, GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- OpenAI API key

### 1. Clone & install

```bash
git clone <repo-url>
cd ai-voice-assistant
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set:
#   OPENAI_API_KEY=sk-...
#   JWT_SECRET=<random 64-char string>
#   JWT_REFRESH_SECRET=<random 64-char string>
```

### 3. Start with Docker (recommended)

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, the backend API, and the frontend.

**Open http://localhost** in your browser.

### 4. Or run locally (development)

```bash
# Terminal 1 — start database services
docker-compose up -d postgres redis

# Terminal 2 — backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed      # creates demo users + agents
npm run dev             # http://localhost:5000

# Terminal 3 — frontend
cd frontend
npm install
npm run dev             # http://localhost:3000
```

---

## 🔑 Demo Credentials

After seeding the database:

| Role  | Email             | Password       |
|-------|-------------------|----------------|
| Demo  | demo@ava.app      | Demo@123456    |
| Admin | admin@ava.app     | Admin@123456   |

---

## 📁 Project Structure

```
ai-voice-assistant/
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Base design system (button, input, card…)
│   │   │   └── layout/      # Dashboard shell (sidebar, navbar)
│   │   ├── pages/           # Route-level page components
│   │   │   ├── auth/        # Login, Register, Forgot/Reset Password
│   │   │   └── dashboard/   # Home, Voice, Chat, Agents, Analytics…
│   │   ├── stores/          # Zustand global state
│   │   ├── services/        # Axios API client + Socket.IO
│   │   └── lib/             # Utilities
│   └── Dockerfile
│
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # DB, Redis, Socket.IO setup
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation, upload, errors
│   │   ├── routes/          # Express routers
│   │   ├── services/        # OpenAI, email, voice, chat
│   │   └── utils/           # JWT, logger
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data
│   └── Dockerfile
│
├── shared/                  # Shared TypeScript types
├── docker/nginx/            # Nginx reverse proxy config
├── .github/workflows/       # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| POST   | `/api/auth/register`        | Create account        |
| POST   | `/api/auth/login`           | Sign in               |
| POST   | `/api/auth/logout`          | Sign out              |
| POST   | `/api/auth/refresh`         | Refresh access token  |
| GET    | `/api/auth/verify-email/:t` | Verify email          |
| POST   | `/api/auth/forgot-password` | Request reset link    |
| POST   | `/api/auth/reset-password`  | Reset password        |
| GET    | `/api/auth/me`              | Get current user      |

### Conversations
| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| GET    | `/api/conversations`      | List conversations    |
| POST   | `/api/conversations`      | Create conversation   |
| GET    | `/api/conversations/:id`  | Get with messages     |
| PATCH  | `/api/conversations/:id`  | Update (star, pin…)   |
| DELETE | `/api/conversations/:id`  | Delete                |

### Messages
| Method | Endpoint                                   | Description           |
|--------|--------------------------------------------|-----------------------|
| GET    | `/api/messages/conversation/:id`           | Get messages          |
| POST   | `/api/messages/conversation/:id`           | Send + stream reply   |
| DELETE | `/api/messages/:id`                        | Delete message        |
| POST   | `/api/messages/:id/reactions`              | Add reaction          |

### Agents, Files, Analytics, Settings, Notifications follow the same CRUD pattern.

---

## 🔌 WebSocket Events

| Event                  | Direction        | Description                |
|------------------------|------------------|----------------------------|
| `voice:audio`          | Client → Server  | Raw audio buffer chunk     |
| `voice:transcript`     | Server → Client  | STT transcript             |
| `voice:response`       | Server → Client  | AI text response           |
| `voice:audio_response` | Server → Client  | TTS audio buffer           |
| `chat:message`         | Client → Server  | Send text message          |
| `chat:stream`          | Server → Client  | Streamed response chunk    |
| `chat:stream_end`      | Server → Client  | Stream complete + ID       |
| `notification`         | Server → Client  | Push notification          |

---

## 🚢 Production Deployment

### Environment variables to set on your server

```bash
# backend/.env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
OPENAI_API_KEY=sk-...
CLIENT_URL=https://yourdomain.com
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

### GitHub Actions secrets needed

| Secret          | Value                            |
|-----------------|----------------------------------|
| `DEPLOY_HOST`   | Server IP / hostname             |
| `DEPLOY_USER`   | SSH username                     |
| `DEPLOY_KEY`    | Private SSH key                  |

### SSL / HTTPS

Place your SSL certificates in `docker/nginx/ssl/` and update `docker/nginx/nginx.conf` to enable the HTTPS server block.

---

## 🛠️ Development Commands

```bash
# Prisma
cd backend
npx prisma studio          # Database GUI
npx prisma migrate dev     # Create migration
npx prisma db seed         # Seed demo data
npx prisma migrate reset   # Reset DB (dev only)

# Docker
docker-compose up -d       # Start all services
docker-compose logs -f     # Stream logs
docker-compose down        # Stop all services
docker-compose down -v     # Stop + delete volumes
```

---