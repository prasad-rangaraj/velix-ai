from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class CommunicationPattern(Base):
    """Stores a computed snapshot of a user's cross-session communication patterns."""
    __tablename__ = "communication_patterns"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, unique=True)
    overall_filler_rate: Mapped[float] = mapped_column(Float, nullable=True)     # fillers per 100 words
    overall_assertiveness: Mapped[int] = mapped_column(Integer, nullable=True)   # 0-100
    sentence_completion_rate: Mapped[int] = mapped_column(Integer, nullable=True)# 0-100
    upspeak_count_avg: Mapped[float] = mapped_column(Float, nullable=True)        # per session
    filler_by_topic: Mapped[dict] = mapped_column(JSONB, nullable=True)           # {topic: rate}
    hesitation_by_type: Mapped[dict] = mapped_column(JSONB, nullable=True)       # {question_type: avg_pause}
    assertiveness_weekly: Mapped[list] = mapped_column(JSONB, nullable=True)     # [score_w1, w2, ...]
    top_insights: Mapped[list] = mapped_column(JSONB, nullable=True)             # list of insight dicts
    sessions_analysed: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    user = relationship("User", back_populates="communication_pattern")
