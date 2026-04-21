from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from collections import defaultdict
from ..database import get_db
from ..models import CommunicationPattern, PracticeSession, SessionReport, User
from .deps import get_current_user

router = APIRouter()

SCENARIO_LABEL_MAP = {
    "job-interview":   "Job Interview",
    "business-meeting":"Business Meeting",
    "daily-convo":     "Daily Conversation",
    "phone-call":      "Phone Call",
    "salary-neg":      "Salary Negotiation",
    "presentation":    "Presentation",
    "executive-comm":  "Executive Comm",
    "email-to-speech": "Conflict Resolution",
}

def _avg(values: list) -> float:
    return round(sum(values) / len(values), 2) if values else 0.0

def _generate_insights(
    filler_rate: float,
    assertiveness: int,
    sentence_completion: int,
    upspeak_avg: float,
    worst_hesitation_topic: str,
) -> list:
    insights = []

    if filler_rate > 4.0:
        insights.append({"type": "filler", "severity": "high",
            "text": f"High filler rate of {filler_rate:.1f} per 100 words.",
            "fix": "Pause instead of filling. Silence is better than 'um'."})
    elif filler_rate > 2.0:
        insights.append({"type": "filler", "severity": "medium",
            "text": f"Moderate filler rate of {filler_rate:.1f} per 100 words.",
            "fix": "Try breathing exercises before answering to reduce fillers."})
    else:
        insights.append({"type": "filler", "severity": "low",
            "text": f"Low filler rate of {filler_rate:.1f} per 100 words — great control.",
            "fix": "Maintain this discipline under pressure."})

    if assertiveness < 55:
        insights.append({"type": "assertiveness", "severity": "high",
            "text": f"Low assertiveness score ({assertiveness}/100).",
            "fix": "Use more direct language: 'I believe' → 'I know'."})
    elif assertiveness < 75:
        insights.append({"type": "assertiveness", "severity": "medium",
            "text": f"Assertiveness at {assertiveness}/100 — room to improve.",
            "fix": "Avoid hedging phrases like 'sort of' and 'I think maybe'."})
    else:
        insights.append({"type": "assertiveness", "severity": "low",
            "text": f"Strong assertiveness at {assertiveness}/100.",
            "fix": "Keep projecting this confidence in high-stakes scenarios."})

    if upspeak_avg > 3:
        insights.append({"type": "hesitation", "severity": "medium",
            "text": f"Upspeak detected approx. {upspeak_avg:.1f}× per session.",
            "fix": "End statements with a drop in pitch, not a rise."})

    if worst_hesitation_topic:
        insights.append({"type": "completion", "severity": "medium",
            "text": f"Most hesitation in '{worst_hesitation_topic}' questions.",
            "fix": f"Practice structured answers for {worst_hesitation_topic} questions specifically."})

    if sentence_completion < 80:
        insights.append({"type": "completion", "severity": "medium",
            "text": f"Sentence completion rate is {sentence_completion}%.",
            "fix": "Finish every sentence before starting the next thought."})

    return insights[:4]


@router.get("")
@router.get("/")
async def get_patterns(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Fetch all completed session reports for this user
    r2 = await db.execute(
        select(SessionReport, PracticeSession)
        .join(PracticeSession, PracticeSession.id == SessionReport.practice_session_id)
        .where(PracticeSession.user_id == user.id)
        .order_by(SessionReport.id)
    )
    rows = r2.all()
    reports = [(rep, sess) for rep, sess in rows]

    sessions_analysed = len(reports)

    # ── Per-topic filler rate ───────────────────────────────────────────────────
    filler_by_topic: dict[str, list] = defaultdict(list)
    hesitation_by_type: dict[str, list] = defaultdict(list)
    upspeak_values: list[float] = []
    sentence_completion_values: list[int] = []
    assertiveness_values: list[int] = []
    assertiveness_by_week: dict[str, list] = defaultdict(list)

    for report, session in reports:
        scenario_label = SCENARIO_LABEL_MAP.get(session.scenario_id or "", session.scenario_title or "Other")
        meta = report.patterns_meta or {}

        filler_rate = meta.get("filler_rate", None)
        if filler_rate is None and report.filler_count and report.wpm:
            # Estimate from filler_count and wpm if patterns_meta not available yet
            total_words = report.wpm * 5  # rough 5-min estimate
            filler_rate = round((report.filler_count / max(total_words, 1)) * 100, 2)
        if filler_rate is not None:
            filler_by_topic[scenario_label].append(filler_rate)

        hesitation_pattern = meta.get("hesitation_pattern")
        if hesitation_pattern:
            hesitation_by_type[hesitation_pattern].append(1)

        upspeak = meta.get("upspeak_count")
        if upspeak is not None:
            upspeak_values.append(float(upspeak))

        sc = meta.get("sentence_completion_rate")
        if sc is not None:
            sentence_completion_values.append(int(sc))

        asrt = meta.get("assertiveness_score", report.confidence_score)
        if asrt is not None:
            assertiveness_values.append(int(asrt))
            # Group by ISO week for the line chart
            try:
                from datetime import datetime
                week_key = f"W{datetime.fromisoformat(session.created_at.replace('Z','') if session.created_at else '').isocalendar()[1]}"
            except Exception:
                week_key = f"W{len(assertiveness_by_week) + 1}"
            assertiveness_by_week[week_key].append(int(asrt))

    # Aggregate the values
    filler_by_topic_agg = {topic: round(_avg(vals), 2) for topic, vals in filler_by_topic.items()}

    # For hesitation: show count-based avg pause proxy
    hesitation_agg = {topic: round(2.0 + count * 0.5, 1)
                      for topic, counts in hesitation_by_type.items()
                      for count in [len(counts)]}

    assertiveness_weekly = [round(_avg(vals)) for vals in assertiveness_by_week.values()]

    overall_filler_rate = _avg([v for vals in filler_by_topic.values() for v in vals])
    overall_assertiveness = round(_avg(assertiveness_values)) if assertiveness_values else int((user.skill_confidence or 0) * 0.7 + (user.skill_fluency or 0) * 0.3)
    sentence_completion_rate = round(_avg(sentence_completion_values)) if sentence_completion_values else 85
    upspeak_avg = round(_avg(upspeak_values), 1) if upspeak_values else 0.0

    worst_hesitation_topic = max(hesitation_by_type, key=lambda k: len(hesitation_by_type[k])) if hesitation_by_type else ""

    top_insights = _generate_insights(
        filler_rate=overall_filler_rate,
        assertiveness=overall_assertiveness,
        sentence_completion=sentence_completion_rate,
        upspeak_avg=upspeak_avg,
        worst_hesitation_topic=worst_hesitation_topic,
    )

    # Upsert the computed snapshot into the DB
    existing = await db.execute(select(CommunicationPattern).where(CommunicationPattern.user_id == user.id))
    pattern = existing.scalars().first()
    if pattern:
        await db.execute(
            update(CommunicationPattern)
            .where(CommunicationPattern.user_id == user.id)
            .values(
                overall_filler_rate=overall_filler_rate,
                overall_assertiveness=overall_assertiveness,
                sentence_completion_rate=sentence_completion_rate,
                upspeak_count_avg=upspeak_avg,
                filler_by_topic=filler_by_topic_agg or {"No Data Yet": 0},
                hesitation_by_type=hesitation_agg or {"No Data Yet": 0},
                assertiveness_weekly=assertiveness_weekly or [overall_assertiveness],
                top_insights=top_insights,
                sessions_analysed=sessions_analysed,
            )
        )
    else:
        pattern = CommunicationPattern(
            user_id=user.id,
            overall_filler_rate=overall_filler_rate,
            overall_assertiveness=overall_assertiveness,
            sentence_completion_rate=sentence_completion_rate,
            upspeak_count_avg=upspeak_avg,
            filler_by_topic=filler_by_topic_agg or {"No Data Yet": 0},
            hesitation_by_type=hesitation_agg or {"No Data Yet": 0},
            assertiveness_weekly=assertiveness_weekly or [overall_assertiveness],
            top_insights=top_insights,
            sessions_analysed=sessions_analysed,
        )
        db.add(pattern)
    await db.commit()

    return {
        "overall_filler_rate": overall_filler_rate,
        "overall_assertiveness": overall_assertiveness,
        "sentence_completion_rate": sentence_completion_rate,
        "upspeak_count_avg": upspeak_avg,
        "filler_by_topic": filler_by_topic_agg or {"No Data Yet": 0},
        "hesitation_by_type": hesitation_agg or {"No Data Yet": 0},
        "assertiveness_weekly": assertiveness_weekly or [overall_assertiveness],
        "top_insights": top_insights,
        "sessions_analysed": sessions_analysed,
        "computed_at": "live",
    }
