import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATABASE_DIR = PROJECT_ROOT / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

LOGS_DIR = BACKEND_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_DIR = LOGS_DIR / "outbox"
OUTBOX_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_DB_PATH = DATABASE_DIR / "logs.db"
DEFAULT_DB_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
DEFAULT_FRONTEND_URL = "http://127.0.0.1:5173"
DEFAULT_PUBLIC_APP_URL = "http://127.0.0.1:8000"
DEFAULT_VERCEL_FRONTEND_URL = "https://capstone-project-ii.vercel.app"
DEFAULT_ALLOWED_ORIGIN_REGEX = r"^https://capstone-project-ii(?:-[a-z0-9-]+)?\.vercel\.app$"


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}

class Settings:
    def __init__(self) -> None:
        reload_default = _as_bool(os.getenv("RELOAD"), True)
        self.app_name = os.getenv("APP_NAME", "PhishGuard API")
        self.app_version = os.getenv("APP_VERSION", "1.0.0")
        self.database_url = os.getenv("DATABASE_URL") or DEFAULT_DB_URL
        self.log_file = (LOGS_DIR / "app.log").as_posix()
        self.frontend_dist_dir = PROJECT_ROOT / "frontend" / "dist"
        self.serve_frontend = _as_bool(os.getenv("SERVE_FRONTEND"), not reload_default)
        self.frontend_base_url = (
            os.getenv("FRONTEND_BASE_URL")
            or os.getenv("RENDER_EXTERNAL_URL")
            or DEFAULT_FRONTEND_URL
        ).rstrip("/")
        self.public_base_url = (
            os.getenv("BACKEND_BASE_URL")
            or os.getenv("RENDER_EXTERNAL_URL")
            or DEFAULT_PUBLIC_APP_URL
        ).rstrip("/")
        configured_origins = [
            origin.strip()
            for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
            if origin.strip()
        ]
        default_origins = {
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            DEFAULT_VERCEL_FRONTEND_URL,
            self.frontend_base_url,
        }
        self.allowed_origins = sorted({*default_origins, *configured_origins})
        self.allowed_origin_regex = (
            os.getenv("ALLOWED_ORIGIN_REGEX") or DEFAULT_ALLOWED_ORIGIN_REGEX
        ).strip()
        self.host = os.getenv("HOST", "127.0.0.1")
        self.port = int(os.getenv("PORT", "8000"))
        self.reload = reload_default
        self.auth_token_expiry_hours = int(os.getenv("AUTH_TOKEN_EXPIRY_HOURS", "168"))
        self.verification_token_expiry_hours = int(os.getenv("VERIFICATION_TOKEN_EXPIRY_HOURS", "24"))
        self.smtp_host = os.getenv("SMTP_HOST", "").strip()
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "").strip()
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", "PhishGuard")
        self.smtp_use_tls = _as_bool(os.getenv("SMTP_USE_TLS"), True)
        self.smtp_use_ssl = _as_bool(os.getenv("SMTP_USE_SSL"), False)
        self.email_debug_preview = _as_bool(os.getenv("EMAIL_DEBUG_PREVIEW"), True)
        self.outbox_dir = OUTBOX_DIR
        self.outbox_file = (OUTBOX_DIR / "email_outbox.log").as_posix()

settings = Settings()
