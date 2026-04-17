from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    return database_url


normalized_database_url = normalize_database_url(settings.database_url)
connect_args = {"check_same_thread": False} if normalized_database_url.startswith("sqlite") else {}

engine = create_engine(
    normalized_database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_database_schema() -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if inspector.has_table("scan_logs"):
        existing_columns = {
            column["name"] for column in inspector.get_columns("scan_logs")
        }
        additions = {
            "user_id": "INTEGER",
            "ml_score": "INTEGER",
            "rule_score": "INTEGER NOT NULL DEFAULT 0",
            "summary": "TEXT NOT NULL DEFAULT ''",
            "recommendation": "TEXT NOT NULL DEFAULT ''",
            "indicators": "TEXT NOT NULL DEFAULT '[]'",
            "snapshot_sent_at": "DATETIME",
        }

        with engine.begin() as connection:
            for column_name, column_ddl in additions.items():
                if column_name not in existing_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE scan_logs ADD COLUMN {column_name} {column_ddl}"
                        )
                    )

            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_scan_logs_user_id ON scan_logs (user_id)"
                )
            )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
