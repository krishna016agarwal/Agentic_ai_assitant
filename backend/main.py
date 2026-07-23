from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from api.chat import router as chat_router
from api.voice import router as voice_router
from config.settings import settings


app = FastAPI(
    title="Enterprise AI Agent",
    version="1.0.0"
)

# Custom CORS middleware to guarantee headers on all responses, preflights & errors
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
    else:
        try:
            response = await call_next(request)
        except Exception as exc:
            print(f"[Unhandled Server Error]: {exc}")
            response = JSONResponse(
                status_code=500,
                content={"detail": str(exc)}
            )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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