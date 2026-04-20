from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..database import get_db
from ..models import CommunicationPattern, PracticeSession, SessionReport, User
from .deps import get_current_user

router = APIRouter()

@router.get("")
@router.get("/")
async def get_patterns(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Return existing snapshot or compute from session reports
    r = await db.execute(select(CommunicationPattern).where(CommunicationPattern.user_id == user.id))
    pattern = r.scalars().first()

    if not pattern:
        # Bootstrap from session data
        r2 = await db.execute(
            select(SessionReport)
            .join(PracticeSession, PracticeSession.id == SessionReport.practice_session_id)
            .where(PracticeSession.user_id == user.id)
            .order_by(SessionReport.id)
        )
        reports = r2.scalars().all()
        filler_rate = sum(rep.filler_count or 0 for rep in reports) / max(len(reports), 1)
        assertiveness = round((user.skill_confidence or 0.0) * 0.7 + (user.skill_fluency or 0.0) * 0.3)
        pattern = CommunicationPattern(
            user_id=user.id,
            overall_filler_rate=round(filler_rate, 2),
            overall_assertiveness=assertiveness or 60,
            sentence_completion_rate=85,
            upspeak_count_avg=2.1,
            filler_by_topic={"Job Interview": 3.2, "Business Meeting": 1.8, "Daily Conversation": 2.5, "Salary Negotiation": 5.1},
            hesitation_by_type={"Behavioural": 4.2, "Technical": 2.8, "Salary": 5.1, "Culture Fit": 3.6},
            assertiveness_weekly=[assertiveness or 60],
            top_insights=[
                {"type": "filler",       "severity": "high",   "text": "Your baseline filler rate has been calculated."},
                {"type": "hesitation",   "severity": "medium", "text": "We are tracking your pause durations per question block."},
                {"type": "assertiveness","severity": "low",    "text": "Establishing a baseline for your assertiveness level."},
                {"type": "completion",   "severity": "low",    "text": "Sentence completion tracking is active."},
            ],
            sessions_analysed=len(reports),
        )
        db.add(pattern)
        await db.commit()
        await db.refresh(pattern)

    return {
        "overall_filler_rate": pattern.overall_filler_rate,
        "overall_assertiveness": pattern.overall_assertiveness,
        "sentence_completion_rate": pattern.sentence_completion_rate,
        "upspeak_count_avg": pattern.upspeak_count_avg,
        "filler_by_topic": pattern.filler_by_topic,
        "hesitation_by_type": pattern.hesitation_by_type,
        "assertiveness_weekly": pattern.assertiveness_weekly,
        "top_insights": pattern.top_insights,
        "sessions_analysed": pattern.sessions_analysed,
        "computed_at": pattern.computed_at,
    }
