import os
from fastapi import APIRouter, Depends, HTTPException
from livekit import api
from .deps import get_current_user
from ..models import User

router = APIRouter()

@router.get("/token")
async def get_livekit_token(
    room_id: str,
    user: User = Depends(get_current_user)
):
    """Generate a secure LiveKit Access Token for the frontend."""
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not livekit_api_key or not livekit_api_secret:
        raise HTTPException(500, "LiveKit credentials are not configured on the server.")

    # Create token for the user to join the specific room
    token = api.AccessToken(
        livekit_api_key, 
        livekit_api_secret
    )
    token.with_identity(f"user-{user.id}-{user.full_name.replace(' ', '')}")
    token.with_name(user.full_name)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_id,
        can_publish=True,
        can_subscribe=True,
    ))

    return {"token": token.to_jwt()}
