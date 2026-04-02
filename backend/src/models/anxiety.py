from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class AnxietyAssessment(Base):
    __tablename__ = "anxiety_assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)          # 0–100
    level: Mapped[str] = mapped_column(String)            # "low" | "moderate" | "high"
    answers: Mapped[list] = mapped_column(JSONB, default=list)  # raw answer indices
    created_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    user = relationship("User", back_populates="anxiety_assessments")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    exercise_type: Mapped[str] = mapped_column(String)   # "cognitive_reframe" | "box_breathing" | "gradual_exposure"
    warmup_step: Mapped[str] = mapped_column(String, nullable=True)
    completed_at: Mapped[str] = mapped_column(String, server_default=func.now().cast(String))

    user = relationship("User", back_populates="exercise_logs")
