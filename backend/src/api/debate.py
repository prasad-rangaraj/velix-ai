from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import DebateSession, DebateArgument, User
from .deps import get_current_user
import random

router = APIRouter()

AI_COUNTERS = {
    "Business": ["Market data contradicts your claim.", "Consider the shareholder perspective.", "That's an appeal to popularity — the numbers tell a different story."],
    "Ethics":   ["From a utilitarian lens, the opposite is true.", "You're appealing to tradition, not evidence.", "Rights-based ethics disagrees — let me explain."],
    "Technology": ["The empirical evidence shows the reverse.", "That conflates correlation and causation.", "Leading AI researchers actually argue the opposite."],
    "Society":  ["Historical precedent contradicts this.", "This overgeneralises from anecdotal evidence.", "Cross-cultural data shows the opposite pattern."],
}

class StartDebateReq(BaseModel):
    topic: str
    category: Optional[str] = "Business"

class ArgueReq(BaseModel):
    text: str

@router.post("/sessions")
async def start_debate(req: StartDebateReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    s = DebateSession(user_id=user.id, topic=req.topic, category=req.category)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"session_id": s.id, "topic": req.topic, "user_position": "FOR", "ai_position": "AGAINST"}

@router.post("/sessions/{session_id}/argue")
async def submit_argument(session_id: int, req: ArgueReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DebateSession).where(DebateSession.id == session_id, DebateSession.user_id == user.id))
    session = r.scalars().first()
    if not session:
        raise HTTPException(404, "Session not found")

    # Simulate scoring based on text richness
    words = req.text.split()
    claim_score = min(100, 40 + len(words) * 2)
    evidence_score = min(100, 30 + req.text.count("because") * 20 + req.text.count("data") * 15)
    rebuttal_score = min(100, 35 + req.text.count("however") * 20 + req.text.count("but") * 10)
    fallacy = None
    if "everyone" in req.text.lower() or "always" in req.text.lower():
        fallacy = "Overgeneralisation"
    elif "popular" in req.text.lower() or "most people" in req.text.lower():
        fallacy = "Appeal to Popularity"

    # Save user argument
    db.add(DebateArgument(
        debate_session_id=session_id, round_number=session.total_rounds + 1,
        side="user", text=req.text, claim_score=claim_score,
        evidence_score=evidence_score, rebuttal_score=rebuttal_score,
        fallacy_detected=fallacy,
    ))

    # AI counter
    counters = AI_COUNTERS.get(session.category or "Business", AI_COUNTERS["Business"])
    ai_text = random.choice(counters)
    db.add(DebateArgument(debate_session_id=session_id, round_number=session.total_rounds + 1, side="ai", text=ai_text))

    await db.execute(update(DebateSession).where(DebateSession.id == session_id).values(
        total_rounds=session.total_rounds + 1,
        fallacies_detected=session.fallacies_detected + (1 if fallacy else 0),
    ))
    await db.commit()
    return {
        "user_scores": {"claim": claim_score, "evidence": evidence_score, "rebuttal": rebuttal_score},
        "fallacy": fallacy, "ai_response": ai_text,
    }

@router.get("/sessions")
async def list_debates(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(DebateSession).where(DebateSession.user_id == user.id).order_by(desc(DebateSession.id)).limit(10))
    return {"sessions": [{"id": s.id, "topic": s.topic, "rounds": s.total_rounds, "created_at": s.created_at} for s in r.scalars().all()]}
