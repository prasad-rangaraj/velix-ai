from sqlalchemy.ext.asyncio import AsyncSession
from ..models.practice import RoadmapItem

async def generate_initial_roadmap(db: AsyncSession, user_id: int):
    """
    Creates a tailored sequence of stages (Basic -> Intermediate -> Advanced).
    """
    items = [
        RoadmapItem(user_id=user_id, title="Introduce Yourself in a Meeting", stage="Basic"),
        RoadmapItem(user_id=user_id, title="Order Coffee professionally", stage="Basic"),
        RoadmapItem(user_id=user_id, title="Job Interview Prep - Strengths", stage="Intermediate"),
        RoadmapItem(user_id=user_id, title="Difficult Conversations: Salary Negotiation", stage="Advanced"),
    ]
    db.add_all(items)
    await db.commit()
    return items
