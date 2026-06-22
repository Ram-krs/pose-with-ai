# Pose With AI

**Dress Smart. Pose Smart. Capture Perfect.**

An AI-powered smart camera application that analyzes your outfit, face, and body posture in real time, recommends suitable poses, compares them with your current pose, provides live corrections, and allows instant photo capture at any moment.

## Features

- **User Authentication** — Register, login (username or email), forgot password, profile management
- **AI Outfit Analysis** — Detects outfit type, colors, patterns, accessories, and fashion style
- **Face Analysis** — Face shape, expression, smile confidence, head angle, best camera angle
- **Body Pose Detection** — Landmarks, posture alignment, shoulder/neck position, pose confidence
- **Smart Pose Recommendations** — Based on outfit, face, body, height, gender, and photography style
- **Pose Match Scoring** — Live match percentage with actionable suggestions
- **Real-Time AI Guidance** — Live voice-style text prompts ("Lift your chin slightly", etc.)
- **Camera Module** — Front/back camera, flash, grid lines, countdown timer, HD capture
- **Always-Enabled Capture** — Capture anytime without pose validation
- **Photo Storage** — Local storage with gallery, download, and share
- **AI Photo Review** — Post-capture scoring for pose, outfit, expression, angle, lighting
- **Pose History** — Previous poses, scores, and recommendations
- **Admin Dashboard** — User management, analytics, AI performance metrics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Python FastAPI, SQLAlchemy |
| AI/ML | MediaPipe, OpenCV, NumPy |
| Database | SQLite (dev) / PostgreSQL (production-ready) |
| Auth | JWT (python-jose + bcrypt) |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### 3. Admin Account

Register with username `admin` to get admin dashboard access.

## Project Structure

```
pose-with-ai/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry
│   │   ├── auth.py          # JWT authentication
│   │   ├── models.py        # Database models
│   │   ├── routes.py        # API endpoints
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── services/
│   │       └── ai_analysis.py  # MediaPipe AI engine
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Camera, Gallery, Profile, Admin
│   │   ├── components/      # Layout, navigation
│   │   ├── api/             # API client
│   │   └── context/         # Auth context
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/users/me` | Get profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/analysis/realtime` | Real-time AI analysis |
| POST | `/api/photos/capture` | Capture & analyze photo |
| GET | `/api/photos/` | List user photos |
| GET | `/api/history/` | Pose history |
| GET | `/api/admin/stats` | Admin analytics |

## Production Notes

- Set a strong `SECRET_KEY` in `.env`
- Switch `DATABASE_URL` to PostgreSQL for production
- Configure AWS S3 or Firebase for cloud photo storage
- Enable HTTPS and restrict CORS origins
- Deploy frontend build (`npm run build`) to CDN/static hosting

## License

MIT
