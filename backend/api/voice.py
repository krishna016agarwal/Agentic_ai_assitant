import os
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from livekit.api import AccessToken, VideoGrants

router = APIRouter(prefix="/voice", tags=["voice"])


class TokenRequest(BaseModel):
    room_name: str = "banking-assistant"
    participant_name: str = "user"


class TokenResponse(BaseModel):
    url: str
    token: str


@router.post("/token", response_model=TokenResponse)
async def get_voice_token(request: TokenRequest):
    """
    Generate a short-lived LiveKit access token so the browser can join
    a room and talk to the voice agent.
    """
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    livekit_url = os.getenv("LIVEKIT_URL")

    if not all([api_key, api_secret, livekit_url]):
        raise HTTPException(
            status_code=500,
            detail="LiveKit credentials are not configured in the server environment.",
        )

    # Give each session a unique participant identity so multiple tabs can connect
    identity = f"{request.participant_name}-{int(time.time())}"

    token = (
        AccessToken(api_key=api_key, api_secret=api_secret)
        .with_identity(identity)
        .with_name(request.participant_name)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=request.room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
    )

    jwt = token.to_jwt()

    return TokenResponse(url=livekit_url, token=jwt)
