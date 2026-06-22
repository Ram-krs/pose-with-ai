from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routes import (
    admin_router,
    analysis_router,
    history_router,
    photos_router,
    profile_router,
    router as auth_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title="Pose With AI",
    description="AI-powered smart camera application for pose recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(analysis_router)
app.include_router(photos_router)
app.include_router(history_router)
app.include_router(admin_router)

if Path(settings.upload_dir).exists():
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "app": "Pose With AI",
        "tagline": "Dress Smart. Pose Smart. Capture Perfect.",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
