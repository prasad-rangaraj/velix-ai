from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class ConferenceSession(Base):
    __tablename__ = "conference_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    meeting_type: Mapped[str] = mapped_column(String)   # "standup" | "pitch" | "board" | "conflict" | "negotiation"
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    avg_confidence: Mapped[int] = mapped_column(Integer, nullable=True)  # 0-100
    personas_used: Mapped[list] = mapped_column(JSONB, default=list)     # ["director","skeptic","ally","observer"]
    coaching_tips_shown: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    completed_at: Mapped[str] = mapped_column(String, nullable=True)

    user = relationship("User", back_populates="conference_sessions")
    transcript = relationship("ConferenceTranscript", back_populates="session")


class ConferenceTranscript(Base):
    __tablename__ = "conference_transcripts"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("conference_sessions.id"))
    speaker: Mapped[str] = mapped_column(String)   # speaker name or "You"
    text: Mapped[str] = mapped_column(Text)
    confidence_at: Mapped[int] = mapped_column(Integer, nullable=True)  # snapshot confidence %
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    session = relationship("ConferenceSession", back_populates="transcript")
