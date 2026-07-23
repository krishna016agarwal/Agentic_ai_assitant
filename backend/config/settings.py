from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    GROQ_API_KEY: str

    MODEL_NAME: str

    COMPANY_DOCS: str

    EMBEDDING_MODEL: str

    CHROMA_PATH: str

    DATABASE_URL: str

    FRONTEND_URL: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()