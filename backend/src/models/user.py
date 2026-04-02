from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Float
from sqlalchemy.dialects.postgresql import JSONB


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_initials: Mapped[str] = mapped_column(String(4), nullable=True)

    # Gamification
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    streak_freeze_count: Mapped[int] = mapped_column(Integer, default=2)
    streak_frozen_today: Mapped[bool] = mapped_column(Boolean, default=False)

    # Goals & Settings
    daily_goal_minutes: Mapped[int] = mapped_column(Integer, default=15)
    weekly_session_target: Mapped[int] = mapped_column(Integer, default=5)
    language_level: Mapped[str] = mapped_column(String, default="B1")  # A1–C2
    profession: Mapped[str] = mapped_column(String, nullable=True)

    # Notification preferences (stored as JSONB)
    notification_prefs: Mapped[dict] = mapped_column(
        JSONB, default=lambda: {"daily": True, "streak": True, "new_content": False}
    )

    # Skill scores (cached averages, updated after each session)
    skill_fluency: Mapped[float] = mapped_column(Float, default=0.0)
    skill_grammar: Mapped[float] = mapped_column(Float, default=0.0)
    skill_pronunciation: Mapped[float] = mapped_column(Float, default=0.0)
    skill_vocabulary: Mapped[float] = mapped_column(Float, default=0.0)
    skill_confidence: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    practice_sessions = relationship("PracticeSession", back_populates="user")
    vocabulary_words = relationship("VocabularyWord", back_populates="user")
    journal_entries = relationship("JournalEntry", back_populates="user")
    conference_sessions = relationship("ConferenceSession", back_populates="user")
    interview_sessions = relationship("InterviewSession", back_populates="user")
    debate_sessions = relationship("DebateSession", back_populates="user")
    anxiety_assessments = relationship("AnxietyAssessment", back_populates="user")
    exercise_logs = relationship("ExerciseLog", back_populates="user")
    communication_pattern = relationship("CommunicationPattern", back_populates="user", uselist=False)
    progress_snapshots = relationship("ProgressSnapshot", back_populates="user")
    achievements = relationship("Achievement", back_populates="user")


class AnonymousSession(Base):
    __tablename__ = "anonymous_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String, unique=True, index=True)
    age_group: Mapped[str] = mapped_column(String, nullable=True)
    profession: Mapped[str] = mapped_column(String, nullable=True)
