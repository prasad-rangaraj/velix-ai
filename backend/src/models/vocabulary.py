from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy import DateTime


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    word: Mapped[str] = mapped_column(String, index=True)
    definition: Mapped[str] = mapped_column(Text, nullable=True)
    phoneme: Mapped[str] = mapped_column(String, nullable=True)      # e.g. /ˈnev.ər.the.ləs/
    articulation_tip: Mapped[str] = mapped_column(Text, nullable=True)
    example_sentence: Mapped[str] = mapped_column(Text, nullable=True)
    # Spaced repetition
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    ease_factor: Mapped[float] = mapped_column(default=2.5)
    times_reviewed: Mapped[int] = mapped_column(Integer, default=0)
    is_mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    next_review_at: Mapped[str] = mapped_column(String, nullable=True)  # ISO date string
    added_at: Mapped[str] = mapped_column(
        String, server_default=func.now().cast(String)
    )

    user = relationship("User", back_populates="vocabulary_words")
