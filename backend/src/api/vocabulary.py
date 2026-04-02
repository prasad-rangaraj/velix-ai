from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from ..database import get_db
from ..models import VocabularyWord, User
from .deps import get_current_user

router = APIRouter()

class AddWordReq(BaseModel):
    word: str
    phonetic: Optional[str] = None
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    articulation_tip: Optional[str] = None
    phonemes: list = []
    saved_from: Optional[str] = None
    difficulty: str = "medium"

class ReviewReq(BaseModel):
    word_id: int
    rating: str   # "easy" | "hard" | "skip"

def sm2_next(interval: int, ease: float, rating: str):
    """Simplified SM-2 algorithm."""
    if rating == "easy":
        new_interval = max(1, round(interval * ease))
        new_ease = min(ease + 0.1, 3.0)
    elif rating == "hard":
        new_interval = 1
        new_ease = max(ease - 0.2, 1.3)
    else:  # skip — no change
        return interval, ease
    return new_interval, new_ease

@router.get("/words")
async def list_words(search: Optional[str] = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(VocabularyWord).where(VocabularyWord.user_id == user.id).order_by(desc(VocabularyWord.id))
    if search:
        q = q.where(VocabularyWord.word.ilike(f"%{search}%"))
    r = await db.execute(q)
    words = r.scalars().all()
    return {"words": [
        {"id": w.id, "word": w.word, "phonetic": w.phonetic, "definition": w.definition,
         "example_sentence": w.example_sentence, "articulation_tip": w.articulation_tip,
         "phonemes": w.phonemes, "saved_from": w.saved_from, "difficulty": w.difficulty,
         "is_mastered": w.is_mastered, "times_reviewed": w.times_reviewed,
         "next_review_at": w.next_review_at, "added_at": w.added_at}
        for w in words
    ]}

@router.post("/words")
async def add_word(req: AddWordReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    next_review = (date.today() + timedelta(days=1)).isoformat()
    w = VocabularyWord(user_id=user.id, next_review_at=next_review, **req.model_dump())
    db.add(w)
    await db.commit()
    await db.refresh(w)
    return {"id": w.id}

@router.delete("/words/{word_id}")
async def delete_word(word_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(VocabularyWord).where(VocabularyWord.id == word_id, VocabularyWord.user_id == user.id))
    w = r.scalars().first()
    if not w:
        raise HTTPException(404, "Word not found")
    await db.delete(w)
    await db.commit()
    return {"ok": True}

@router.get("/review")
async def get_review_queue(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today().isoformat()
    r = await db.execute(
        select(VocabularyWord)
        .where(VocabularyWord.user_id == user.id, VocabularyWord.is_mastered == False,
               VocabularyWord.next_review_at <= today)
        .order_by(VocabularyWord.next_review_at).limit(20)
    )
    return {"words": [{"id": w.id, "word": w.word, "phonetic": w.phonetic, "definition": w.definition} for w in r.scalars().all()]}

@router.post("/review")
async def submit_review(req: ReviewReq, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(VocabularyWord).where(VocabularyWord.id == req.word_id, VocabularyWord.user_id == user.id))
    w = r.scalars().first()
    if not w:
        raise HTTPException(404, "Word not found")
    new_interval, new_ease = sm2_next(w.interval_days, w.ease_factor, req.rating)
    next_review = (date.today() + timedelta(days=new_interval)).isoformat()
    is_mastered = new_interval >= 21
    await db.execute(update(VocabularyWord).where(VocabularyWord.id == req.word_id).values(
        interval_days=new_interval, ease_factor=new_ease, times_reviewed=w.times_reviewed + 1,
        next_review_at=next_review, is_mastered=is_mastered,
    ))
    await db.commit()
    return {"next_review_at": next_review, "is_mastered": is_mastered}
