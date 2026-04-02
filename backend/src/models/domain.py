from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    word: Mapped[str] = mapped_column(String, index=True)
    phonetic: Mapped[str] = mapped_column(String, nullable=True)        # /ɑːrˈtɪk.jʊ.lət/
    definition: Mapped[str] = mapped_column(Text, nullable=True)
    example_sentence: Mapped[str] = mapped_column(Text, nullable=True)
    articulation_tip: Mapped[str] = mapped_column(Text, nullable=True)
    phonemes: Mapped[list] = mapped_column(JSONB, default=list)         # [{symbol, sound, tip}]
    saved_from: Mapped[str] = mapped_column(String, nullable=True)      # scenario title
    difficulty: Mapped[str] = mapped_column(String, default="medium")   # easy|medium|hard
    # Spaced repetition SM-2 fields
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    times_reviewed: Mapped[int] = mapped_column(Integer, default=0)
    is_mastered: Mapped[bool] = mapped_column(Boolean, default=False)
    next_review_at: Mapped[str] = mapped_column(String, nullable=True)
    added_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="vocabulary_words")


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str] = mapped_column(String, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    fluency_score: Mapped[int] = mapped_column(Integer, nullable=True)
    vocab_score: Mapped[int] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=True)
    new_words: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="journal_entries")


class ConferenceSession(Base):
    __tablename__ = "conference_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    meeting_type: Mapped[str] = mapped_column(String)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    avg_confidence: Mapped[int] = mapped_column(Integer, nullable=True)
    personas_used: Mapped[list] = mapped_column(JSONB, default=list)
    coaching_tips_shown: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    completed_at: Mapped[str] = mapped_column(String, nullable=True)
    user = relationship("User", back_populates="conference_sessions")
    transcript = relationship("ConferenceTranscript", back_populates="session")


class ConferenceTranscript(Base):
    __tablename__ = "conference_transcripts"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("conference_sessions.id"), index=True)
    speaker: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(Text)
    confidence_at: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    session = relationship("ConferenceSession", back_populates="transcript")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_description: Mapped[str] = mapped_column(Text)
    company_name: Mapped[str] = mapped_column(String, nullable=True)
    culture_signals: Mapped[dict] = mapped_column(JSONB, nullable=True)
    questions: Mapped[list] = mapped_column(JSONB, default=list)
    domain_vocab: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="interview_sessions")


class DebateSession(Base):
    __tablename__ = "debate_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    topic: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String, nullable=True)
    total_rounds: Mapped[int] = mapped_column(Integer, default=0)
    avg_claim_score: Mapped[float] = mapped_column(Float, nullable=True)
    avg_evidence_score: Mapped[float] = mapped_column(Float, nullable=True)
    avg_rebuttal_score: Mapped[float] = mapped_column(Float, nullable=True)
    fallacies_detected: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="debate_sessions")
    arguments = relationship("DebateArgument", back_populates="debate_session")


class DebateArgument(Base):
    __tablename__ = "debate_arguments"
    id: Mapped[int] = mapped_column(primary_key=True)
    debate_session_id: Mapped[int] = mapped_column(ForeignKey("debate_sessions.id"), index=True)
    round_number: Mapped[int] = mapped_column(Integer)
    side: Mapped[str] = mapped_column(String)          # "user" | "ai"
    text: Mapped[str] = mapped_column(Text)
    claim_score: Mapped[int] = mapped_column(Integer, nullable=True)
    evidence_score: Mapped[int] = mapped_column(Integer, nullable=True)
    rebuttal_score: Mapped[int] = mapped_column(Integer, nullable=True)
    fallacy_detected: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    debate_session = relationship("DebateSession", back_populates="arguments")


class AnxietyAssessment(Base):
    __tablename__ = "anxiety_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String)   # "low" | "moderate" | "high"
    answers: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="anxiety_assessments")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    exercise_type: Mapped[str] = mapped_column(String)
    warmup_step: Mapped[str] = mapped_column(String, nullable=True)
    completed_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="exercise_logs")


class CommunicationPattern(Base):
    __tablename__ = "communication_patterns"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, unique=True)
    overall_filler_rate: Mapped[float] = mapped_column(Float, nullable=True)
    overall_assertiveness: Mapped[int] = mapped_column(Integer, nullable=True)
    sentence_completion_rate: Mapped[int] = mapped_column(Integer, nullable=True)
    upspeak_count_avg: Mapped[float] = mapped_column(Float, nullable=True)
    filler_by_topic: Mapped[dict] = mapped_column(JSONB, nullable=True)
    hesitation_by_type: Mapped[dict] = mapped_column(JSONB, nullable=True)
    assertiveness_weekly: Mapped[list] = mapped_column(JSONB, nullable=True)
    top_insights: Mapped[list] = mapped_column(JSONB, nullable=True)
    sessions_analysed: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))
    user = relationship("User", back_populates="communication_pattern")
