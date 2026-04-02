from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models import PracticeSession, SessionReport, Achievement, User
from .deps import get_current_user

router = APIRouter()

ALL_ACHIEVEMENTS = [
    {"key": "first_session",  "icon": "🎯", "label": "First Session"},
    {"key": "streak_7",       "icon": "🔥", "label": "7-Day Streak"},
    {"key": "xp_500",         "icon": "💎", "label": "500 XP Club"},
    {"key": "sessions_10",    "icon": "🎤", "label": "10 Sessions"},
    {"key": "score_90",       "icon": "🏆", "label": "Score 90+"},
    {"key": "native_fluency", "icon": "🌍", "label": "Native Fluency"},
]

@router.get("/overview")
async def progress_overview(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Aggregate session stats
    r = await db.execute(
        select(
            func.count(PracticeSession.id).label("total"),
            func.sum(PracticeSession.duration_minutes).label("minutes"),
            func.avg(SessionReport.overall_score).label("avg_score"),
        )
        .join(SessionReport, SessionReport.practice_session_id == PracticeSession.id, isouter=True)
        .where(PracticeSession.user_id == user.id, PracticeSession.status == "completed")
    )
    row = r.one()

    # Weekly activity and full calendar history
    r2 = await db.execute(
        select(
            PracticeSession.id, 
            PracticeSession.scenario_title, 
            PracticeSession.completed_at, 
            PracticeSession.duration_minutes, 
            PracticeSession.xp_earned,
            SessionReport.overall_score
        )
        .outerjoin(SessionReport, SessionReport.practice_session_id == PracticeSession.id)
        .where(PracticeSession.user_id == user.id, PracticeSession.status == "completed")
        .order_by(desc(PracticeSession.completed_at)).limit(150)
    )
    history = r2.all()

    return {
        "total_sessions": row.total or 0,
        "total_minutes": row.minutes or 0,
        "avg_score": round(row.avg_score or 0),
        "current_streak": user.current_streak,
        "total_xp": user.total_xp,
        "skills": {
            "fluency":       round(user.skill_fluency),
            "grammar":       round(user.skill_grammar),
            "pronunciation": round(user.skill_pronunciation),
            "vocabulary":    round(user.skill_vocabulary),
            "confidence":    round(user.skill_confidence),
        },
        "recent_sessions": [
            {
                "id": s.id,
                "title": s.scenario_title,
                "date": s.completed_at,
                "minutes": s.duration_minutes or 0,
                "xp": s.xp_earned or 0,
                "score": s.overall_score or 0
            }
            for s in history
        ],
    }

@router.get("/achievements")
async def list_achievements(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Achievement.key).where(Achievement.user_id == user.id))
    earned_keys = {row[0] for row in r.all()}
    return {"achievements": [
        {**a, "earned": a["key"] in earned_keys}
        for a in ALL_ACHIEVEMENTS
    ]}
