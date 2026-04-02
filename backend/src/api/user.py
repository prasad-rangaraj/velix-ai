from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import User
from ..services.auth_service import get_password_hash, verify_password
from .deps import get_current_user

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language_level: Optional[str] = None
    profession: Optional[str] = None
    daily_goal_minutes: Optional[int] = None
    weekly_session_target: Optional[int] = None
    notification_prefs: Optional[dict] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class StreakFreezeAction(BaseModel):
    action: str = "freeze"

@router.get("/me")
async def get_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_initials": user.avatar_initials or user.full_name[:2].upper(),
        "language_level": user.language_level,
        "profession": user.profession,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "total_xp": user.total_xp,
        "streak_freeze_count": user.streak_freeze_count,
        "streak_frozen_today": user.streak_frozen_today,
        "daily_goal_minutes": user.daily_goal_minutes,
        "weekly_session_target": user.weekly_session_target,
        "notification_prefs": user.notification_prefs,
        "skills": {
            "fluency": user.skill_fluency,
            "grammar": user.skill_grammar,
            "pronunciation": user.skill_pronunciation,
            "vocabulary": user.skill_vocabulary,
            "confidence": user.skill_confidence,
        },
    }

@router.patch("/me")
async def update_profile(
    req: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates = req.model_dump(exclude_none=True)
    if updates:
        await db.execute(update(User).where(User.id == user.id).values(**updates))
        await db.commit()
    return {"ok": True}

@router.post("/me/password")
async def change_password(
    req: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(400, "Current password incorrect")
    await db.execute(
        update(User).where(User.id == user.id)
        .values(hashed_password=get_password_hash(req.new_password))
    )
    await db.commit()
    return {"ok": True}

@router.post("/me/streak-freeze")
async def use_streak_freeze(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.streak_freeze_count <= 0:
        raise HTTPException(400, "No streak freezes available")
    if user.streak_frozen_today:
        raise HTTPException(400, "Streak already frozen today")
    await db.execute(
        update(User).where(User.id == user.id).values(
            streak_freeze_count=user.streak_freeze_count - 1,
            streak_frozen_today=True,
        )
    )
    await db.commit()
    return {"ok": True, "freezes_remaining": user.streak_freeze_count - 1}

@router.get("/me/stats")
async def get_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from ..models import PracticeSession
    from sqlalchemy import func
    result = await db.execute(
        select(
            func.count(PracticeSession.id).label("sessions"),
            func.sum(PracticeSession.duration_minutes).label("total_minutes"),
            func.sum(PracticeSession.xp_earned).label("total_xp"),
        ).where(PracticeSession.user_id == user.id, PracticeSession.status == "completed")
    )
    row = result.one()
    return {
        "total_sessions": row.sessions or 0,
        "total_minutes": row.total_minutes or 0,
        "total_xp": row.total_xp or 0,
        "current_streak": user.current_streak,
    }
