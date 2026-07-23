from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.chat import router as chat_router
from api.voice import router as voice_router
from config.settings import settings


app = FastAPI(
    title="Enterprise AI Agent",
    version="1.0.0"
)

# Parse CORS origins from settings
raw_origins = settings.FRONTEND_URL.split(",")
allowed_origins = [origin.strip() for origin in raw_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|http://.*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(voice_router)


@app.get("/")
async def home():
    return {
        "message": "Enterprise AI Agent Running"
    }