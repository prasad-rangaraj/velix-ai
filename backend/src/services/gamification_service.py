from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.user import User

async def award_xp(db: AsyncSession, user_id: int, base_xp: int = 10):
    """Awards experience points to a user after a session."""
    statement = select(User).where(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalars().first()
    
    if user:
        user.total_xp += base_xp
        await db.commit()
    return user

async def extend_streak(db: AsyncSession, user_id: int):
    """Extends the user's daily streak if they haven't practiced today."""
    statement = select(User).where(User.id == user_id)
    result = await db.execute(statement)
    user = result.scalars().first()
    
    if user:
        # Simplified: always increment for demo purposes.
        # In production, check last session date to avoid double-incrementing on the same day
        user.current_streak += 1
        await db.commit()
    return user
