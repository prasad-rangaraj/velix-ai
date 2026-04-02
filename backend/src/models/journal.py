from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    fluency_score: Mapped[int] = mapped_column(Integer, nullable=True)
    vocab_score: Mapped[int] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=True)
    new_words: Mapped[list] = mapped_column(JSONB, default=list)     # list of new words used
    metrics_json: Mapped[dict] = mapped_column(JSONB, nullable=True) # extra metrics
    created_at: Mapped[str] = mapped_column(
        String, server_default=func.now().cast(String)
    )

    user = relationship("User", back_populates="journal_entries")
