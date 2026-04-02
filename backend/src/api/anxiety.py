from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from pydantic import BaseModel
from ..database import get_db
from ..models import AnxietyAssessment, ExerciseLog, User
from .deps import get_current_user

router = APIRouter()

class AssessmentReq(BaseModel):
    answers: list[int]   # list of answer indices (0-3) for 4 questions

class ExerciseLogReq(BaseModel):
    exercise_type: str
    warmup_step: str = None

EXERCISES = [
    {"id": "cognitive_reframe", "title": "Cognitive Reframe", "description": "Challenge and reframe anxious thoughts.", "steps": ["Identify the anxious thought", "Ask: Is this thought based on fact or fear?", "Generate 3 alternative explanations", "Choose the most realistic one", "Say it aloud with confidence"]},
    {"id": "box_breathing",     "title": "Box Breathing",     "description": "4-4-4-4 breathing to calm the nervous system.", "steps": ["Exhale all air from lungs", "Inhale for 4 counts", "Hold for 4 counts", "Exhale for 4 counts", "Hold for 4 counts", "Repeat 4×"]},
    {"id": "gradual_exposure",  "title": "Gradual Exposure", "description": "Step-by-step practice for high-anxiety situations.", "steps": ["List 5 feared communication scenarios", "Rank them 1-5 (least to most scary)", "Practice #1 daily for 3 days", "Move to #2 when comfortable", "Track comfort level each session"]},
]

WARMUP_STEPS = ["Take 3 deep breaths", "Shake out your hands", "Say your name aloud", "Smile for 10 seconds", "Repeat: 'I am prepared'"]

@router.post("/assessment")
async def submit_assessment(req: AssessmentReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Score: each answer 0-3 → higher = more anxiety
    raw = sum(req.answers)
    max_score = len(req.answers) * 3
    score = round((raw / max_score) * 100)
    level = "high" if score >= 70 else ("moderate" if score >= 40 else "low")
    a = AnxietyAssessment(user_id=user.id, score=score, level=level, answers=req.answers)
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return {"id": a.id, "score": score, "level": level}

@router.get("/assessment/latest")
async def latest_assessment(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(AnxietyAssessment).where(AnxietyAssessment.user_id == user.id).order_by(desc(AnxietyAssessment.id)).limit(1))
    a = r.scalars().first()
    if not a:
        return {"assessment": None}
    return {"assessment": {"score": a.score, "level": a.level, "created_at": a.created_at}}

@router.get("/exercises")
async def list_exercises():
    return {"exercises": EXERCISES}

@router.post("/exercises/log")
async def log_exercise(req: ExerciseLogReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db.add(ExerciseLog(user_id=user.id, exercise_type=req.exercise_type, warmup_step=req.warmup_step))
    await db.commit()
    return {"ok": True}

@router.get("/warmup")
async def get_warmup():
    return {"steps": WARMUP_STEPS}
