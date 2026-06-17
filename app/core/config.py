from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Banco de dados (Supabase via Session Pooler — IPv4)
    database_url: str

    # JWT
    jwt_secret: str
    jwt_access_ttl_ms: int = 28800000      # 8h
    jwt_refresh_ttl_ms: int = 604800000    # 7 dias

    # App
    app_env: str = "development"
    app_port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:8080,http://localhost:5173"

    # Uploads
    public_base_url: str = "http://localhost:8000"
    upload_dir: str = "uploads"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
