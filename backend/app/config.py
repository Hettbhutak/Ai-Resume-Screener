from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Dutient Resume Screening API"
    app_env: str = "dev"
    database_url: str = "sqlite:///./dutient.db"
    cors_origins: str = "*"
    upload_dir: str = "./storage"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
