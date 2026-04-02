from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import InterviewSession, User
from .deps import get_current_user
import re

router = APIRouter()

QUESTION_TEMPLATES = {
    "leadership":    {"q": "Tell me about a time you led a team through a challenge.", "weight": "high"},
    "conflict":      {"q": "How do you handle disagreements with colleagues?", "weight": "high"},
    "achievement":   {"q": "What is your most significant professional achievement?", "weight": "medium"},
    "challenge":     {"q": "Describe a difficult situation and how you resolved it.", "weight": "high"},
    "motivation":    {"q": "Why are you interested in this specific role?", "weight": "medium"},
    "technical":     {"q": "Walk me through your experience with the core technical skills mentioned.", "weight": "high"},
    "growth":        {"q": "Where do you see yourself in 5 years?", "weight": "low"},
}

class AnalyzeJDReq(BaseModel):
    job_description: str
    company_name: Optional[str] = None

@router.post("/analyze")
async def analyze_jd(req: AnalyzeJDReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    jd = req.job_description.lower()

    # Extract domain vocab
    domain_keywords = re.findall(r'\b[A-Za-z][a-z]+ [A-Za-z][a-z]+\b', req.job_description)
    domain_vocab = list(set(domain_keywords[:8]))

    # Determine culture signals
    is_startup = any(w in jd for w in ["fast-paced", "startup", "growth", "agile"])
    is_corp = any(w in jd for w in ["enterprise", "corporate", "stakeholder", "compliance"])
    seniority = "senior" if any(w in jd for w in ["senior", "lead", "principal", "director"]) else "mid"
    tone = "formal" if is_corp else ("startup" if is_startup else "professional")

    # Build questions
    questions = []
    if "lead" in jd or "team" in jd:
        questions.append({**QUESTION_TEMPLATES["leadership"], "star_hint": "Situation: set context → Task: your role → Action: what YOU did → Result: measurable impact"})
    if "conflict" in jd or "collaborate" in jd:
        questions.append({**QUESTION_TEMPLATES["conflict"], "star_hint": "Focus on your interpersonal skills and outcome"})
    questions.append({**QUESTION_TEMPLATES["achievement"], "star_hint": "Quantify the result — use numbers or %"})
    questions.append({**QUESTION_TEMPLATES["challenge"], "star_hint": "Show resilience and problem-solving"})
    questions.append({**QUESTION_TEMPLATES["motivation"], "star_hint": "Connect to the company's mission in the JD"})
    if "python" in jd or "sql" in jd or "cloud" in jd or "api" in jd:
        questions.append({**QUESTION_TEMPLATES["technical"], "star_hint": "Be specific — name tools, version numbers, outcomes"})
    questions.append({**QUESTION_TEMPLATES["growth"], "star_hint": "Align with the role's growth path", "weight": "low"})

    culture_signals = {"tone": tone, "seniority": seniority, "is_startup": is_startup, "is_corp": is_corp}

    # Save session
    s = InterviewSession(
        user_id=user.id, job_description=req.job_description,
        company_name=req.company_name, culture_signals=culture_signals,
        questions=questions, domain_vocab=domain_vocab,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"session_id": s.id, "questions": questions, "culture_signals": culture_signals, "domain_vocab": domain_vocab}

@router.get("/sessions")
async def list_sessions(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(InterviewSession).where(InterviewSession.user_id == user.id).order_by(desc(InterviewSession.id)).limit(10))
    return {"sessions": [{"id": s.id, "company_name": s.company_name, "created_at": s.created_at, "question_count": len(s.questions)} for s in r.scalars().all()]}
