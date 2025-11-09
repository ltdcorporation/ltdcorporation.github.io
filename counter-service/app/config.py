import os
from functools import lru_cache
from pydantic import AnyUrl
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: AnyUrl = os.getenv("DATABASE_URL")  # type: ignore[assignment]
    namespace_prefix: str = "asiafap"

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required")
    return settings
