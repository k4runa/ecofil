# ecofil

ecofil is a high-performance, AI-powered movie tracking and social ecosystem. Built with a focus on aesthetic excellence and intelligent discovery, it helps users manage their cinematic journey through personalized AI insights and a secure, modern platform.

## App Status

| Platform | Status | Version |
| :--- | :--- | :--- |
| **Web Dashboard** | Stable / Feature Complete | 1.0.0 |
| **Mobile App (iOS/Android)** | In Development (Expo) | 0.8.5 |

## Features

- **Personalized AI Assistant:** Context-aware recommendations using Gemini/Llama-3 that explain *why* a movie fits your taste.
- **Monochrome Premium UI:** A high-contrast, professional design system focused on content and clarity.
- **Social Discovery:** Find "Similar Minds" and connect with users who share your cinematic DNA.
- **Real-time Messaging:** Secure, instant communication between community members.
- **Privacy First:** Fine-grained control over profile visibility and personal data.

## Tech Stack

### Backend & Infrastructure
- **Framework:** FastAPI (Asynchronous Python 3.12+)
- **Database:** PostgreSQL 16 (SQLAlchemy Async + Alembic)
- **Security:** JWT Auth, SlowAPI (Rate Limiting), Identity-based RBAC
- **AI Intelligence:** Google Gemini Pro, Groq (Llama-3 70B)

### Frontend (Web)
- **Architecture:** Next.js 15 (App Router, Turbopack)
- **Styling:** Tailwind CSS + Framer Motion (Premium Animations)
- **State Management:** Zustand

### Mobile (Active Dev)
- **Framework:** React Native / Expo
- **Navigation:** Expo Router (File-based)
- **Experience:** Native-first smooth interactions and haptic feedback.

## Quick Start

### 1. Environment Setup

Copy the environment template and provide your API keys (TMDB, Gemini/Groq):

```bash
cp .env.example .env
```

### 2. Database

Start the PostgreSQL database container:

```bash
docker-compose up -d ecofil_db
```

### 3. Backend & Migrations

```bash
# Install dependencies
pip install -r requirements.txt

# Apply migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

### 4. Frontend

```bash
cd web
npm install
npm run dev
```

The API is available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

## Production Deployment

ecofil uses a multi-stage Docker build to package both the backend and the frontend into a single container.

```bash
# Build and start production containers
docker-compose up -d --build
```

Access the application at `http://localhost:8000/ui/`

## Infrastructure Notes

- **Identity Management:** Access control is managed through JWT tokens, ensuring secure and direct ownership of data.
- **Performance:** Database queries are optimized with targeted indexing and async connection pooling.
- **Schema Management:** All database changes are strictly versioned with Alembic to ensure consistency across environments.
- **Static Hosting:** The Next.js frontend is served directly by the FastAPI backend to simplify the architecture.
