from dotenv import load_dotenv

load_dotenv()  # carrega .env no os.environ antes de qualquer import que use Settings

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, calculations, logistics, uploads, users
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Calculadora 3D API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https?://.*\.easypanel\.host",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(calculations.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(logistics.router, prefix="/api")

# Fotos de produto servidas como estáticos (a URL pública vem de PUBLIC_BASE_URL)
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
