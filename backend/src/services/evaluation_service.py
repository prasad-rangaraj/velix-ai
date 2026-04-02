from sqlalchemy.ext.asyncio import AsyncSession
from ..models.practice import SessionReport

async def generate_evaluation_report(db: AsyncSession, practice_session_id: int, transcript_text: str):
    """
    Calls Gemini 2.0 to evaluate a user's transcript for grammatical and fluency corrections.
    """
    # Mocking Gemini text-based evaluation delay and logic
    word_count = len(transcript_text.split())
    fluency = min(100, word_count * 2)
    grammar = 85
    
    report = SessionReport(
        practice_session_id=practice_session_id,
        fluency_score=fluency,
        grammar_score=grammar,
        metrics_json={"words_per_minute": word_count, "parasitic_words_percentage": 2}
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
