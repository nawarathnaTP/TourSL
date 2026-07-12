from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings, loaded from environment variables / .env file.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    GOOGLE_PLACES_API_KEY: str
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recommendation_engine"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
