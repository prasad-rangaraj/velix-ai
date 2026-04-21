from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scenario_id: Mapped[str] = mapped_column(String, nullable=True)   # e.g. "job-interview"
    scenario_title: Mapped[str] = mapped_column(String, nullable=True)
    scenario_type: Mapped[str] = mapped_column(String, default="free-form")  # "preset" | "custom" | "flash"
    custom_prompt: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")     # "active" | "completed" | "abandoned"
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    completed_at: Mapped[str] = mapped_column(String, nullable=True)

    user = relationship("User", back_populates="practice_sessions")
    session_report = relationship("SessionReport", back_populates="practice_session", uselist=False)
    turns = relationship("ConversationTurn", back_populates="practice_session", order_by="ConversationTurn.id")


class SessionReport(Base):
    __tablename__ = "session_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    practice_session_id: Mapped[int] = mapped_column(ForeignKey("practice_sessions.id"), unique=True)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=True)    # 0–100
    fluency_score: Mapped[int] = mapped_column(Integer, nullable=True)
    grammar_score: Mapped[int] = mapped_column(Integer, nullable=True)
    pronunciation_score: Mapped[int] = mapped_column(Integer, nullable=True)
    vocabulary_score: Mapped[int] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=True)
    # Prev-session scores for delta comparison
    prev_fluency: Mapped[int] = mapped_column(Integer, nullable=True)
    prev_grammar: Mapped[int] = mapped_column(Integer, nullable=True)
    prev_pronunciation: Mapped[int] = mapped_column(Integer, nullable=True)
    prev_vocabulary: Mapped[int] = mapped_column(Integer, nullable=True)
    prev_confidence: Mapped[int] = mapped_column(Integer, nullable=True)
    filler_count: Mapped[int] = mapped_column(Integer, default=0)
    wpm: Mapped[int] = mapped_column(Integer, nullable=True)             # words per minute
    feedback_items: Mapped[list] = mapped_column(JSONB, default=list)   # [{type, text, fix}]
    vocabulary_saved: Mapped[list] = mapped_column(JSONB, default=list) # new words auto-saved
    patterns_meta: Mapped[dict] = mapped_column(JSONB, nullable=True)   # per-session talk pattern data

    practice_session = relationship("PracticeSession", back_populates="session_report")


class ConversationTurn(Base):
    __tablename__ = "conversation_turns"

    id: Mapped[int] = mapped_column(primary_key=True)
    practice_session_id: Mapped[int] = mapped_column(ForeignKey("practice_sessions.id"), index=True)
    speaker: Mapped[str] = mapped_column(String)     # "user" | "ai"
    transcript: Mapped[str] = mapped_column(Text)
    audio_url: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    practice_session = relationship("PracticeSession", back_populates="turns")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    stage: Mapped[str] = mapped_column(String)          # "Basic" | "Intermediate" | "Advanced"
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[str] = mapped_column(String, nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)


class ProgressSnapshot(Base):
    """Monthly aggregated progress stored for trend chart."""
    __tablename__ = "progress_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    month: Mapped[str] = mapped_column(String)     # "2026-03"
    sessions_count: Mapped[int] = mapped_column(Integer, default=0)
    practice_minutes: Mapped[int] = mapped_column(Integer, default=0)
    avg_score: Mapped[int] = mapped_column(Integer, nullable=True)
    fluency: Mapped[float] = mapped_column(Float, nullable=True)
    grammar: Mapped[float] = mapped_column(Float, nullable=True)
    pronunciation: Mapped[float] = mapped_column(Float, nullable=True)
    vocabulary: Mapped[float] = mapped_column(Float, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    activity_log: Mapped[list] = mapped_column(JSONB, default=list)  # [{date, count}]

    user = relationship("User", back_populates="progress_snapshots")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    key: Mapped[str] = mapped_column(String)         # "first_session" | "7_day_streak" | etc.
    earned_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    user = relationship("User", back_populates="achievements")
