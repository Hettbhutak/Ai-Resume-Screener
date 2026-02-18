import os

from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore


class Settings(BaseSettings):
    app_name: str = "Dutient Resume Screening API"
    app_env: str = "dev"
    database_url: str = "sqlite:////tmp/dutient.db" if os.getenv("VERCEL") else "sqlite:///./dutient.db"
    cors_origins: str = "*"
    upload_dir: str = "/tmp/storage" if os.getenv("VERCEL") else "./storage"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
