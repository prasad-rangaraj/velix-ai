from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import JournalEntry, User
from .deps import get_current_user

router = APIRouter()

class JournalEntryReq(BaseModel):
    transcript: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: int = 0
    fluency_score: Optional[int] = None
    vocab_score: Optional[int] = None
    confidence_score: Optional[int] = None
    new_words: list = []

@router.get("/entries")
async def list_entries(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(JournalEntry).where(JournalEntry.user_id == user.id).order_by(desc(JournalEntry.id)).limit(30))
    return {"entries": [
        {"id": e.id, "created_at": e.created_at, "duration_seconds": e.duration_seconds,
         "fluency_score": e.fluency_score, "vocab_score": e.vocab_score,
         "confidence_score": e.confidence_score, "new_words": e.new_words,
         "transcript": e.transcript}
        for e in r.scalars().all()
    ]}

@router.post("/entries")
async def create_entry(req: JournalEntryReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    e = JournalEntry(user_id=user.id, **req.model_dump())
    db.add(e)
    await db.commit()
    await db.refresh(e)
    return {"id": e.id}
