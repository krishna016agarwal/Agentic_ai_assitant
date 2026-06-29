from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    GROQ_API_KEY: str

    MODEL_NAME: str

    COMPANY_DOCS: str

    EMBEDDING_MODEL: str

    CHROMA_PATH: str

    DATABASE_URL: str

    UPLOAD_DIR: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()