from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    GROQ_API_KEY: str = ""

    MODEL_NAME: str = "llama-3.3-70b-versatile"

    COMPANY_DOCS: str = "company_data/documents"

    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    CHROMA_PATH: str = "company_data/chroma_db_v2"

    DATABASE_URL: str = "sqlite:///database/company.db"

    FRONTEND_URL: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()