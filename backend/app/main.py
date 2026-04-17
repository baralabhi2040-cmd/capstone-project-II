from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import ensure_database_schema
from app.routes.auth_routes import router as auth_router
from app.routes.email_routes import router as email_router
from app.routes.health_routes import router as health_router
from app.routes.log_routes import router as log_router
from app.routes.snapshot_routes import router as snapshot_router
from app.routes.sms_routes import router as sms_router
from app.routes.social_routes import router as social_router
from app.routes.stats_routes import router as stats_router
from app.routes.url_routes import router as url_router
from app.utils.logger import logger

ensure_database_schema()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(url_router)
app.include_router(email_router)
app.include_router(sms_router)
app.include_router(social_router)
app.include_router(log_router)
app.include_router(stats_router)
app.include_router(snapshot_router)
app.include_router(health_router)

@app.get("/")
def root():
    index_file = settings.frontend_dist_dir / "index.html"
    if settings.serve_frontend and index_file.exists():
        return FileResponse(index_file)

    logger.info("Root endpoint accessed.")
    return {
        "message": "PhishGuard API is running.",
        "version": settings.app_version,
    }


def _frontend_ready() -> bool:
    return settings.serve_frontend and settings.frontend_dist_dir.exists()


def _safe_frontend_path(relative_path: str) -> Path:
    requested = (settings.frontend_dist_dir / relative_path).resolve()
    frontend_root = settings.frontend_dist_dir.resolve()

    try:
        requested.relative_to(frontend_root)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="File not found.") from exc

    return requested


@app.get("/{full_path:path}", include_in_schema=False)
def frontend_app(full_path: str):
    if not _frontend_ready():
        raise HTTPException(status_code=404, detail="Not found.")

    requested_file = _safe_frontend_path(full_path)
    index_file = settings.frontend_dist_dir / "index.html"

    if requested_file.is_file():
        return FileResponse(requested_file)

    return FileResponse(index_file)
