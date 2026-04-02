from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class DebateSession(Base):
    __tablename__ = "debate_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    topic: Mapped[str] = mapped_column(String)
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
    debate_session_id: Mapped[int] = mapped_column(ForeignKey("debate_sessions.id"))
    round_number: Mapped[int] = mapped_column(Integer)
    side: Mapped[str] = mapped_column(String)    # "user" | "ai"
    text: Mapped[str] = mapped_column(Text)
    claim_score: Mapped[int] = mapped_column(Integer, nullable=True)
    evidence_score: Mapped[int] = mapped_column(Integer, nullable=True)
    rebuttal_score: Mapped[int] = mapped_column(Integer, nullable=True)
    fallacy_detected: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    debate_session = relationship("DebateSession", back_populates="arguments")
