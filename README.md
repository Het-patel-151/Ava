# AVA — AI Voice Assistant


AVA is a full-stack AI voice assistant.

| What you get          | Technology                 |
| --------------------- | -------------------------- |
| AI Chat (GPT-quality) | Ollama + Llama 3.2 (local) |
| Voice-to-Text         | faster-whisper (local)     |
| Text-to-Speech        | Piper TTS (local)          |
| Email (dev)           | Mailpit (local)            |
| Database              | PostgreSQL (local)         |
| Cache                 | Redis (local)              |

---

## Prerequisites

Install these once:

| Tool               | Download                                        | Why               |
| ------------------ | ----------------------------------------------- | ----------------- |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ | Runs everything   |
| **Git** (optional) | https://git-scm.com                             | To clone the repo |

That's it. No Node.js, no Python, no API keys needed.

> **RAM requirement:** Llama 3.2 (3B model) needs ~4GB RAM minimum.
> 8GB+ RAM recommended for a smooth experience.

---

## Quick Start (3 steps)

### Step 1 — Unzip and configure

```bash
unzip ai-voice-assistant.zip
cd ai-voice-assistant

# Copy the environment file
cp backend/.env.example backend/.env

# Generate secure JWT secrets (run both lines)
# On Mac/Linux:
sed -i "s/change-me-use-openssl-rand-hex-32/$(openssl rand -hex 32)/" backend/.env
sed -i "s/change-me-use-another-openssl-rand-hex-32/$(openssl rand -hex 32)/" backend/.env

# On Windows (PowerShell) — just open backend/.env and paste any long random strings
```

### Step 2 — Start everything

```bash
docker-compose up -d
```

This downloads and starts:

* PostgreSQL + Redis (fast, ~30 seconds)
* Ollama with Llama 3.2 (~2GB download, first time only)
* faster-whisper for voice recognition
* Piper for text-to-speech
* The backend API + frontend

**First run takes 5–15 minutes** (downloading AI models). After that, startup is under 30 seconds.

### Step 3 — Set up the database

```bash
# Run once after first docker-compose up
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma db seed
```

### Open the app

Go to **http://localhost** in your browser.

**Login:**

* Email: `demo@ava.local`
* Password: `Demo@123456`

---

## Check Status

```bash
# See all running services
docker-compose ps

# Watch startup logs (Ctrl+C to stop)
docker-compose logs -f

# Check only the AI model download progress
docker-compose logs -f ollama-init

# Check backend health
curl http://localhost:5001/health
```

---

## Services & Ports

| Service         | URL                    | What it is        |
| --------------- | ---------------------- | ----------------- |
| **AVA App**     | http://localhost       | Main web app      |
| **Backend API** | http://localhost:5001  | REST API          |
| **Ollama**      | http://localhost:11434 | Local LLM server  |
| **Whisper**     | http://localhost:9000  | Voice recognition |
| **Piper TTS**   | http://localhost:5000  | Text-to-speech    |
| **Mailpit**     | http://localhost:8025  | View emails (dev) |
| **PostgreSQL**  | localhost:5432         | Database          |
| **Redis**       | localhost:6379         | Cache             |

---

## Changing the AI Model

Want a smarter (bigger) or faster (smaller) model? Easy:

```bash
# Pull any model from https://ollama.com/library
docker-compose exec ollama ollama pull mistral        # 4GB, great general use
docker-compose exec ollama ollama pull llama3.1       # 5GB, smarter
docker-compose exec ollama ollama pull phi3           # 2GB, fastest
docker-compose exec ollama ollama pull gemma2         # 6GB, Google's model
docker-compose exec ollama ollama pull deepseek-r1    # 5GB, strong reasoning
docker-compose exec ollama ollama pull qwen2.5        # 5GB, best multilingual
```

Then update `backend/.env`:

```env
OLLAMA_MODEL=mistral
```

And restart:

```bash
docker-compose restart backend
```

---

## Voice Feature Notes

* **Voice-to-text** uses `faster-whisper` running locally
* **Text-to-speech** uses `Piper TTS` running locally
* If Piper is slow to start, the chat will show text responses until it's ready
* Voice works best in **Chrome** or **Edge** (they support the Web Speech API)
* Microphone permission is required — browser will ask on first use

---

## Stopping & Starting

```bash
# Stop everything (keeps your data)
docker-compose down

# Start again (fast, models already downloaded)
docker-compose up -d

# Full reset — deletes ALL data and re-downloads models
docker-compose down -v
```

---

## Troubleshooting

**"Ollama is slow to respond"**

* Normal for first few messages while the model loads into RAM
* After the first response, subsequent ones are much faster
* If you have a GPU, uncomment the GPU section in `docker-compose.yml`

**"Voice recognition not working"**

* Allow microphone access in your browser when prompted
* Make sure you're on `http://localhost` (not an IP address)
* Check Whisper is running: `docker-compose ps whisper`

**"Not enough memory"**

* Switch to the smaller Phi-3 model: set `OLLAMA_MODEL=phi3` in `backend/.env`
* Phi-3 needs only ~2GB RAM

**"Port 80 already in use"**

* Change `"80:80"` to `"8080:80"` in `docker-compose.yml`
* Then open http://localhost:8080

**Database errors on first run**

* Wait 30 seconds for PostgreSQL to fully start, then re-run the migrate command

**See detailed logs for a specific service:**

```bash
docker-compose logs -f backend    # API errors
docker-compose logs -f ollama     # AI model errors
docker-compose logs -f whisper    # Voice errors
docker-compose logs -f postgres   # Database errors
```

---

## Project Structure

```text
ai-voice-assistant/
├── frontend/          # React + Vite + Tailwind UI
├── backend/           # Express + TypeScript API
│   ├── src/services/
│   │   ├── ai.service.ts      ← Ollama integration
│   │   ├── voice.service.ts   ← Whisper + Piper
│   │   └── email.service.ts   ← Mailpit
│   └── prisma/schema.prisma   ← Database schema
├── docker/nginx/      # Reverse proxy config
├── docker-compose.yml ← All services defined here
└── README.md
```

---

## Hardware Recommendations

| RAM  | Recommended Model | Speed |
| ---- | ----------------- | ----- |
| 4GB  | `phi3` (2GB)      | Fast  |
| 8GB  | `llama3.2` (2GB)  | Good  |
| 16GB | `mistral` (4GB)   | Great |
| 32GB | `llama3.1` (5GB)  | Best  |


---
