from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from ..database import get_db
from ..models import (
    PracticeSession, SessionReport, ConversationTurn,
    RoadmapItem, User, Achievement, VocabularyWord
)
from .deps import get_current_user

router = APIRouter()

SCENARIOS = [
    {"id": "job-interview",    "title": "Job Interview",          "level": "Job Seeker",   "duration": "15–20 min", "description": "Answer behavioural questions using STAR.", "skills": ["Articulation", "Confidence", "Structure"]},
    {"id": "business-meeting", "title": "Business Meeting",       "level": "Professional",  "duration": "20–30 min", "description": "Lead meetings and summarise outcomes.",   "skills": ["Facilitation", "Listening", "Diplomacy"]},
    {"id": "daily-convo",      "title": "Daily Conversation",     "level": "Beginner",      "duration": "5–10 min",  "description": "Build real fluency in everyday English.", "skills": ["Fluency", "Vocabulary", "Tone"]},
    {"id": "phone-call",       "title": "Phone Calls",            "level": "Beginner",      "duration": "10–15 min", "description": "Navigate calls — clarity and pacing.",    "skills": ["Clarity", "Pacing", "Confidence"]},
    {"id": "salary-neg",       "title": "Salary Negotiation",     "level": "Professional",  "duration": "15–25 min", "description": "Articulate your value confidently.",      "skills": ["Assertiveness", "Logic", "Data"]},
    {"id": "presentation",     "title": "Presentations",          "level": "Advanced",      "duration": "20–30 min", "description": "Deliver ideas with impact.",              "skills": ["Structure", "Delivery", "Q&A"]},
    {"id": "executive-comm",   "title": "Executive Communication","level": "Advanced",      "duration": "25–35 min", "description": "Communicate with authority.",             "skills": ["Authority", "Conciseness", "Leadership"]},
    {"id": "email-to-speech",  "title": "Meeting Conflict",       "level": "Professional",  "duration": "15–20 min", "description": "Navigate disagreements constructively.",  "skills": ["Empathy", "Logic", "Diplomacy"]},
]

class StartSessionReq(BaseModel):
    scenario_id: Optional[str] = None
    custom_prompt: Optional[str] = None
    session_type: str = "preset"   # "preset" | "custom" | "flash"

class CompleteSessionReq(BaseModel):
    duration_minutes: int
    overall_score: int
    fluency_score: int
    grammar_score: int
    pronunciation_score: int
    vocabulary_score: int
    confidence_score: int
    filler_count: int = 0
    wpm: Optional[int] = None
    feedback_items: list = []
    vocabulary_saved: list = []
    patterns_meta: Optional[dict] = None

class TurnReq(BaseModel):
    speaker: str
    transcript: str

@router.get("/scenarios")
async def list_scenarios(level: Optional[str] = None):
    data = [s for s in SCENARIOS if not level or s["level"] == level]
    return {"scenarios": data}

@router.post("/sessions")
async def start_session(
    req: StartSessionReq,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenario = next((s for s in SCENARIOS if s["id"] == req.scenario_id), None)
    session = PracticeSession(
        user_id=user.id,
        scenario_id=req.scenario_id,
        scenario_title=scenario["title"] if scenario else "Custom",
        scenario_type=req.session_type,
        custom_prompt=req.custom_prompt,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"session_id": session.id, "status": "active"}

@router.patch("/sessions/{session_id}/complete")
async def complete_session(
    session_id: int,
    req: CompleteSessionReq,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PracticeSession).where(PracticeSession.id == session_id, PracticeSession.user_id == user.id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(404, "Session not found")

    # XP calculation
    xp = min(req.duration_minutes * 5 + req.overall_score // 2, 200)

    # Prev skill scores for deltas
    report = SessionReport(
        practice_session_id=session_id,
        overall_score=req.overall_score,
        fluency_score=req.fluency_score, grammar_score=req.grammar_score,
        pronunciation_score=req.pronunciation_score, vocabulary_score=req.vocabulary_score,
        confidence_score=req.confidence_score,
        prev_fluency=int(user.skill_fluency), prev_grammar=int(user.skill_grammar),
        prev_pronunciation=int(user.skill_pronunciation), prev_vocabulary=int(user.skill_vocabulary),
        prev_confidence=int(user.skill_confidence),
        filler_count=req.filler_count, wpm=req.wpm,
        feedback_items=req.feedback_items, vocabulary_saved=req.vocabulary_saved,
        patterns_meta=req.patterns_meta,
    )
    db.add(report)

    # Hydrate Vocabulary Queue with extracted LLM terms (Fixes empty Vocabulary page)
    if req.vocabulary_saved:
        from datetime import date, timedelta
        for word in req.vocabulary_saved:
            next_review = (date.today() + timedelta(days=1)).isoformat()
            vw = VocabularyWord(
                user_id=user.id, 
                word=word,
                definition="Autosaved from Context: " + session.scenario_title,
                difficulty="medium",
                saved_from=session.scenario_title,
                next_review_at=next_review
            )
            db.add(vw)

    # Update session + user running averages
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(update(PracticeSession).where(PracticeSession.id == session_id).values(
        status="completed", duration_minutes=req.duration_minutes,
        xp_earned=xp, completed_at=now,
    ))

    def avg(old, new): return round((old * 0.7 + new * 0.3), 2)
    await db.execute(update(User).where(User.id == user.id).values(
        total_xp=user.total_xp + xp,
        current_streak=user.current_streak + 1,
        longest_streak=max(user.longest_streak, user.current_streak + 1),
        skill_fluency=avg(user.skill_fluency or req.fluency_score, req.fluency_score),
        skill_grammar=avg(user.skill_grammar or req.grammar_score, req.grammar_score),
        skill_pronunciation=avg(user.skill_pronunciation or req.pronunciation_score, req.pronunciation_score),
        skill_vocabulary=avg(user.skill_vocabulary or req.vocabulary_score, req.vocabulary_score),
        skill_confidence=avg(user.skill_confidence or req.confidence_score, req.confidence_score),
    ))

    # --- Roadmap Progression ---
    if req.overall_score >= 70:
        first_incomplete = await db.execute(
            select(RoadmapItem).where(RoadmapItem.user_id == user.id, RoadmapItem.is_completed == False)
            .order_by(RoadmapItem.order_index).limit(1)
        )
        next_item = first_incomplete.scalars().first()
        if next_item:
            next_item.is_completed = True
            db.add(next_item)

    # --- Achievements ---
    r_ach = await db.execute(select(Achievement.key).where(Achievement.user_id == user.id))
    earned = {k for k in r_ach.scalars().all()}
    
    new_ach = []
    r_count = await db.execute(select(func.count(PracticeSession.id)).where(PracticeSession.user_id == user.id, PracticeSession.status == "completed"))
    session_count = (r_count.scalar() or 0) + 1  # includes this session which is now completed in DB
    
    if "first_session" not in earned and session_count >= 1:
        new_ach.append(Achievement(user_id=user.id, key="first_session"))
    if "10_sessions" not in earned and session_count >= 10:
        new_ach.append(Achievement(user_id=user.id, key="10_sessions"))
    if "7_day_streak" not in earned and (user.current_streak + 1) >= 7:
        new_ach.append(Achievement(user_id=user.id, key="7_day_streak"))
    if "500_xp_club" not in earned and (user.total_xp + xp) >= 500:
        new_ach.append(Achievement(user_id=user.id, key="500_xp_club"))
    if "score_90_plus" not in earned and req.overall_score >= 90:
        new_ach.append(Achievement(user_id=user.id, key="score_90_plus"))
    if "native_fluency" not in earned and req.fluency_score >= 95:
        new_ach.append(Achievement(user_id=user.id, key="native_fluency"))
        
    for ach in new_ach:
        db.add(ach)

    await db.commit()
    return {"xp_earned": xp, "session_id": session_id}

@router.get("/sessions")
async def list_sessions(
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.user_id == user.id, PracticeSession.status == "completed")
        .order_by(desc(PracticeSession.id)).limit(limit)
    )
    sessions = result.scalars().all()
    return {"sessions": [
        {"id": s.id, "title": s.scenario_title, "type": s.scenario_type,
         "duration": s.duration_minutes, "xp": s.xp_earned,
         "created_at": s.created_at, "completed_at": s.completed_at}
        for s in sessions
    ]}

@router.get("/sessions/{session_id}/report")
async def get_report(session_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(SessionReport, PracticeSession)
        .join(PracticeSession, PracticeSession.id == SessionReport.practice_session_id)
        .where(PracticeSession.id == session_id, PracticeSession.user_id == user.id)
    )
    row = r.first()
    if not row:
        raise HTTPException(404, "Report not found")
    
    report, session = row
    
    return {
        "scenario_title": session.scenario_title,
        "created_at": session.created_at,
        "duration_minutes": session.duration_minutes,
        "overall_score": report.overall_score,
        "scores": {
            "fluency": report.fluency_score, "grammar": report.grammar_score,
            "pronunciation": report.pronunciation_score, "vocabulary": report.vocabulary_score,
            "confidence": report.confidence_score,
        },
        "prev_scores": {
            "fluency": report.prev_fluency, "grammar": report.prev_grammar,
            "pronunciation": report.prev_pronunciation, "vocabulary": report.prev_vocabulary,
            "confidence": report.prev_confidence,
        },
        "filler_count": report.filler_count, "wpm": report.wpm,
        "feedback_items": report.feedback_items,
        "vocabulary_saved": report.vocabulary_saved,
    }

@router.post("/sessions/{session_id}/turns")
async def add_turn(
    session_id: int, req: TurnReq,
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    turn = ConversationTurn(practice_session_id=session_id, speaker=req.speaker, transcript=req.transcript)
    db.add(turn)
    await db.commit()
    return {"ok": True}

@router.get("/sessions/{session_id}/turns")
async def get_turns(session_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(ConversationTurn).where(ConversationTurn.practice_session_id == session_id))
    turns = r.scalars().all()
    return {"turns": [{"speaker": t.speaker, "transcript": t.transcript, "at": t.created_at} for t in turns]}

@router.get("/roadmap")
async def get_roadmap(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(RoadmapItem).where(RoadmapItem.user_id == user.id).order_by(RoadmapItem.order_index))
    items = r.scalars().all()
    if not items:
        # Auto-generate default roadmap on first call
        defaults = [
            ("Introductions & Small Talk", "Basic", 0, False),
            ("Describing Your Work", "Basic", 1, False),
            ("Job Interview Basics", "Basic", 2, False),
            ("Email & Professional Writing", "Basic", 3, False),
            ("Meeting Facilitation", "Intermediate", 4, False),
            ("Salary Negotiation", "Intermediate", 5, False),
            ("Client Presentations", "Advanced", 6, False),
            ("Dealing with Conflict", "Advanced", 7, False),
            ("Advanced Fluency & Idioms", "Advanced", 8, False),
            ("Executive Communication", "Advanced", 9, False),
        ]
        for title, stage, idx, done in defaults:
            db.add(RoadmapItem(user_id=user.id, title=title, stage=stage, order_index=idx, is_completed=done))
        await db.commit()
        r2 = await db.execute(select(RoadmapItem).where(RoadmapItem.user_id == user.id).order_by(RoadmapItem.order_index))
        items = r2.scalars().all()
    return {"items": [{"id": i.id, "title": i.title, "stage": i.stage, "done": i.is_completed} for i in items]}
