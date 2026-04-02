from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from ..database import get_db
from ..models import ConferenceSession, ConferenceTranscript, User
from .deps import get_current_user

router = APIRouter()

class StartConferenceReq(BaseModel):
    meeting_type: str
    personas_used: list = ["director", "skeptic", "ally", "observer"]

class EndConferenceReq(BaseModel):
    duration_seconds: int
    avg_confidence: Optional[int] = None
    coaching_tips_shown: int = 0

class TranscriptTurnReq(BaseModel):
    speaker: str
    text: str
    confidence_at: Optional[int] = None

@router.post("/sessions")
async def start_conference(req: StartConferenceReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = ConferenceSession(user_id=user.id, meeting_type=req.meeting_type, personas_used=req.personas_used)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"session_id": s.id}

@router.patch("/sessions/{session_id}/end")
async def end_conference(session_id: int, req: EndConferenceReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(update(ConferenceSession).where(ConferenceSession.id == session_id, ConferenceSession.user_id == user.id).values(
        duration_seconds=req.duration_seconds, avg_confidence=req.avg_confidence,
        coaching_tips_shown=req.coaching_tips_shown, completed_at=now,
    ))
    await db.commit()
    return {"ok": True}

@router.post("/sessions/{session_id}/transcript")
async def add_turn(session_id: int, req: TranscriptTurnReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = ConferenceTranscript(session_id=session_id, speaker=req.speaker, text=req.text, confidence_at=req.confidence_at)
    db.add(t)
    await db.commit()
    return {"ok": True}

@router.get("/sessions")
async def list_conferences(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ConferenceSession).where(ConferenceSession.user_id == user.id).order_by(desc(ConferenceSession.id)).limit(10))
    return {"sessions": [{"id": s.id, "meeting_type": s.meeting_type, "duration_seconds": s.duration_seconds, "avg_confidence": s.avg_confidence, "created_at": s.created_at} for s in r.scalars().all()]}
