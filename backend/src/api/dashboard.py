from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, outerjoin
from datetime import date
from ..database import get_db
from ..models import PracticeSession, SessionReport, RoadmapItem, User, VocabularyWord
from .deps import get_current_user

router = APIRouter()

@router.get("/")
async def get_dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Recent sessions (last 3)
    r = await db.execute(
        select(PracticeSession, SessionReport)
        .outerjoin(SessionReport, SessionReport.practice_session_id == PracticeSession.id)
        .where(PracticeSession.user_id == user.id, PracticeSession.status == "completed")
        .order_by(desc(PracticeSession.id)).limit(5)
    )
    recent = r.all()

    # Today's practice minutes
    today_str = date.today().isoformat()
    r2 = await db.execute(
        select(func.sum(PracticeSession.duration_minutes))
        .where(PracticeSession.user_id == user.id, PracticeSession.status == "completed",
               PracticeSession.completed_at.startswith(today_str))
    )
    today_minutes = r2.scalar() or 0

    # Roadmap (first incomplete item)
    r3 = await db.execute(
        select(RoadmapItem).where(RoadmapItem.user_id == user.id, RoadmapItem.is_completed == False)
        .order_by(RoadmapItem.order_index).limit(1)
    )
    next_item = r3.scalars().first()

    # Vocab due today
    r4 = await db.execute(
        select(func.count(VocabularyWord.id))
        .where(VocabularyWord.user_id == user.id, VocabularyWord.is_mastered == False,
               VocabularyWord.next_review_at <= today_str)
    )
    vocab_due = r4.scalar() or 0

    return {
        "user": {
            "full_name": user.full_name,
            "avatar_initials": user.avatar_initials or user.full_name[:2].upper(),
            "language_level": user.language_level,
        },
        "streak": user.current_streak,
        "total_xp": user.total_xp,
        "daily_goal": {
            "current": today_minutes,
            "target": user.daily_goal_minutes,
            "percentage": min(round((today_minutes / max(user.daily_goal_minutes, 1)) * 100), 100),
        },
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
                "created_at": s.created_at,
                "xp": s.xp_earned,
                "overall_score": rep.overall_score if rep else None,
            }
            for s, rep in recent
        ],
        "next_roadmap_item": {"title": next_item.title, "stage": next_item.stage} if next_item else None,
        "vocab_due_count": vocab_due,
    }
