from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import re
from groq import AsyncGroq
from .deps import get_current_user
from ..models import User

# Load .env on every module reload (uvicorn --reload safe)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def _groq_key() -> str:
    return os.environ.get("GROQ_API_KEY", "")

router = APIRouter()

SCENARIO_PROMPTS: dict[str, str] = {
    "job-interview": (
        "You are a professional job interviewer conducting a realistic mock interview. "
        "Ask behavioural questions (STAR method), probe deeper with follow-ups, and be professional yet encouraging. "
        "Keep each response under 3 sentences. After every 3 user turns, give a brief coaching note."
    ),
    "business-meeting": (
        "You are a senior colleague facilitating a business meeting. "
        "Raise agenda items, ask for updates, simulate disagreements constructively. Keep responses concise and realistic."
    ),
    "daily-convo": (
        "You are a friendly English conversation partner for everyday practice. "
        "Talk casually about daily topics, correct grammar gently inline, and ask engaging questions."
    ),
    "phone-call": (
        "You are on an audio phone call (no visuals). Simulate a realistic workplace phone call — "
        "customer service, scheduling, or follow-up call. Keep responses as you would on an actual call."
    ),
    "salary-neg": (
        "You are an HR manager in a salary negotiation. Be politely firm, question the user's value claims, "
        "and simulate real negotiation dynamics. Keep each turn concise."
    ),
    "presentation": (
        "You are an audience member and coach during a presentation. Ask challenging questions, "
        "give mid-presentation feedback, and simulate realistic Q&A."
    ),
    "executive-comm": (
        "You are a C-suite executive. Expect clear, concise, data-driven communication. "
        "Challenge vague statements and ask for specifics."
    ),
    "email-to-speech": (
        "You are a colleague in a conflict resolution meeting. Present the other side's perspective "
        "calmly but firmly, and guide the conversation toward resolution."
    ),
}

DEFAULT_SYSTEM = (
    "You are an AI English communication coach conducting a realistic practice session. "
    "Be professional, encouraging, and keep each response under 3 sentences."
)


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatReq(BaseModel):
    scenario_id: Optional[str] = None
    messages: List[Message]  # full conversation history
    custom_prompt: Optional[str] = None


class ScoreReq(BaseModel):
    scenario_id: Optional[str] = None
    transcript: List[Message]  # complete transcript to score
    session_id: Optional[int] = None

@router.post("/chat")
async def ai_chat(req: ChatReq, user: User = Depends(get_current_user)):
    """Send a message to the AI and get a response."""
    if not _groq_key():
        # Graceful fallback if no Groq key
        scenario = req.scenario_id or "general"
        fallback_responses = {
            "job-interview": "Tell me about a time you faced a challenging situation at work. How did you handle it using the STAR method?",
            "business-meeting": "Good point. Let's capture that as an action item — who should own this and by when?",
            "daily-convo": "That's really interesting! What made you feel that way? I'd love to hear more.",
            "salary-neg": "I understand your perspective. Our budget is fairly set — are there other benefits or flexibility that matter to you?",
            "phone-call": "Let me just confirm what you said — can you repeat the key details so I can make sure I have them right?",
            "presentation": "Interesting slide. Can you walk me through the data behind that claim?",
            "executive-comm": "What's the bottom line impact? Give me the three key numbers.",
            "email-to-speech": "I hear you — but let's focus on finding a solution that works for both teams. What would that look like?",
        }
        reply = fallback_responses.get(scenario, "That's a great point! Can you elaborate further on that?")
        return {"reply": reply, "fallback": True}

    client = AsyncGroq(api_key=_groq_key())
    system = req.custom_prompt or SCENARIO_PROMPTS.get(req.scenario_id or "", DEFAULT_SYSTEM)

    messages = [{"role": "system", "content": system}]
    for msg in req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=200,
            temperature=0.7,
        )
        reply = response.choices[0].message.content or ""
        return {"reply": reply, "fallback": False}
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .deps import get_db
from ..models.practice import ConversationTurn

@router.post("/score")
async def score_session(req: ScoreReq, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Analyze a completed transcript and produce skill scores + feedback items using Groq."""
    import json
    
    actual_transcript = list(req.transcript)
    if not actual_transcript and req.session_id:
        result = await db.execute(select(ConversationTurn).where(ConversationTurn.practice_session_id == req.session_id).order_by(ConversationTurn.id))
        turns = result.scalars().all()
        actual_transcript = [Message(role=t.speaker, content=t.transcript) for t in turns]

    if not _groq_key() or len(actual_transcript) < 2:
        # Graceful heuristic fallback if API key is missing
        user_turns = [m for m in actual_transcript if m.role == "user"]
        total_words = sum(len(t.content.split()) for t in user_turns)
        avg_len = total_words / max(len(user_turns), 1)
        fluency = min(95, 55 + min(avg_len, 30))
        return {
            "overall_score": 75,
            "fluency_score": int(fluency),
            "grammar_score": 70,
            "pronunciation_score": 75,
            "vocabulary_score": 65,
            "confidence_score": 72,
            "filler_count": max(0, len(user_turns) - 2),
            "wpm": max(100, min(180, int(avg_len * 2.5))),
            "feedback_items": [{"type": "info", "text": "Fallback Mode", "fix": "Please add GROQ_API_KEY for dynamic scoring."}],
            "vocabulary_saved": [],
        }

    client = AsyncGroq(api_key=_groq_key())
    
    # Formulate a prompt requesting JSON output
    system_prompt = """You are an expert English communication evaluator. Analyze the user's side of the transcript deeply and produce a JSON evaluation.
Calculate realistic scores (0-100) based strictly on their spoken logic, structure, vocabulary depth, and grammatical exactness. Count filler words literally used.
Required JSON format:
{
  "overall_score": int,
  "fluency_score": int,
  "grammar_score": int,
  "pronunciation_score": int,
  "vocabulary_score": int,
  "confidence_score": int,
  "filler_count": int,
  "wpm": int,
  "feedback_items": [{"type": "success" | "warning" | "error", "text": "Short observation", "fix": "Actionable advice"}],
  "vocabulary_saved": ["word1", "word2"],
  "filler_rate": float,
  "upspeak_count": int,
  "sentence_completion_rate": int,
  "hesitation_pattern": "Behavioural" | "Technical" | "Salary" | "Culture Fit" | "General",
  "assertiveness_score": int
}
For filler_rate: count filler words (um, uh, like, basically, you know, sort of) per 100 words spoken.
For upspeak_count: count sentences ending with rising intonation (question-like endings where a statement is expected).
For sentence_completion_rate: percentage of sentences the user completed without trailing off (0-100).
For hesitation_pattern: the question/topic category where the user hesitated or struggled most.
For assertiveness_score: how confident and direct the user communicated (0-100).
(Note: For vocabulary_saved, ALWAYS extract at least 1-3 useful or interesting vocabulary words from the session to help the user learn. Even for short sessions, pick out foundational words to review.)"""
    
    transcript_text = "\\n".join([f"{msg.role.capitalize()}: {msg.content}" for msg in actual_transcript])
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Please evaluate this transcript:\\n\\n{transcript_text}"}
    ]

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=800,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return {
            "overall_score": data.get("overall_score", 75),
            "fluency_score": data.get("fluency_score", 75),
            "grammar_score": data.get("grammar_score", 75),
            "pronunciation_score": data.get("pronunciation_score", 75),
            "vocabulary_score": data.get("vocabulary_score", 75),
            "confidence_score": data.get("confidence_score", 75),
            "filler_count": data.get("filler_count", 0),
            "wpm": data.get("wpm", 130),
            "feedback_items": data.get("feedback_items", [{"type": "success", "text": "Session Complete", "fix": "Great practice!"}]),
            "vocabulary_saved": data.get("vocabulary_saved", [])[:3],
            "patterns_meta": {
                "filler_rate": data.get("filler_rate", 0.0),
                "upspeak_count": data.get("upspeak_count", 0),
                "sentence_completion_rate": data.get("sentence_completion_rate", 85),
                "hesitation_pattern": data.get("hesitation_pattern", "General"),
                "assertiveness_score": data.get("assertiveness_score", data.get("confidence_score", 60)),
            },
        }
    except Exception as e:
        print(f"[ERROR] Groq json parse failure: {e}")
        return {
            "overall_score": 70, "fluency_score": 70, "grammar_score": 70, "pronunciation_score": 70, 
            "vocabulary_score": 70, "confidence_score": 70, "filler_count": 0, "wpm": 120,
            "feedback_items": [{"type": "error", "text": "Analysis Failure", "fix": "Failed to generate dynamic insights"}],
            "vocabulary_saved": []
        }

    client = AsyncGroq(api_key=_groq_key())
    transcript_text = "\n".join(
        f"{'User' if m.role == 'user' else 'AI'}: {m.content}"
        for m in actual_transcript
    )

    score_prompt = f"""
You are an English communication coach. Analyse the following practice conversation transcript and return a JSON object with these exact keys:
- overall_score: 0-100 integer
- fluency_score: 0-100 integer
- grammar_score: 0-100 integer
- pronunciation_score: 0-100 integer (infer from text quality)
- vocabulary_score: 0-100 integer
- confidence_score: 0-100 integer
- filler_count: integer (estimated filler words used)
- wpm: integer (estimated words per minute, typical 120-180)
- feedback_items: array of up to 3 objects, each with "type" ("warning"|"error"|"info"), "text" (issue title), "fix" (actionable fix)
- vocabulary_saved: array of up to 3 impressive words the user used

Return ONLY valid JSON, no explanation.

Transcript:
{transcript_text}
"""
    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": score_prompt}],
            max_tokens=600,
            temperature=0.3,
        )
        raw = response.choices[0].message.content or "{}"
        # Extract JSON from response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            import json
            data = json.loads(match.group())
            return data
    except Exception:
        pass

    # Fallback if parsing fails
    return {
        "overall_score": 75,
        "fluency_score": 78,
        "grammar_score": 72,
        "pronunciation_score": 76,
        "vocabulary_score": 70,
        "confidence_score": 74,
        "filler_count": 5,
        "wpm": 135,
        "feedback_items": [
            {"type": "info", "text": "Good session completed", "fix": "Review your transcript and note areas to improve."},
        ],
        "vocabulary_saved": [],
    }
