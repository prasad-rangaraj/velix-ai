from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    job_description: Mapped[str] = mapped_column(Text)
    company_name: Mapped[str] = mapped_column(String, nullable=True)
    culture_signals: Mapped[dict] = mapped_column(JSONB, nullable=True)  # tone, seniority, domain, buzzwords
    questions: Mapped[list] = mapped_column(JSONB, default=list)         # generated questions with weight + STAR hint
    domain_vocab: Mapped[list] = mapped_column(JSONB, default=list)      # extracted vocabulary
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    user = relationship("User", back_populates="interview_sessions")
