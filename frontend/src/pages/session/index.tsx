import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/layouts/SidebarLayout";
import { PhoneOff, Lightbulb, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/utils";
import { LiveKitSession } from "./LiveKitSession";
import { useProfileStore } from "@/store";

const COACHING_TIPS: Record<string, { icon: string; title: string; body: string }[]> = {
  "job-interview": [
    { icon: "🎯", title: "Use STAR structure", body: "Situation → Task → Action → Result. Cover all four points in each example." },
    { icon: "📊", title: "Quantify impact", body: "Add numbers: '30% faster', '3 weeks ahead of schedule', '$50k saved'." },
    { icon: "⏸️", title: "Pause before answering", body: "1–2 second pause signals confidence. Never rush your response." },
    { icon: "💭", title: "Avoid filler words", body: "Replace 'um/like/basically' with a brief pause. You'll sound more authoritative." },
    { icon: "👁️", title: "Upgrade vocabulary", body: "Instead of 'good result', try 'measurable outcome' or 'significant impact'." },
  ],
  "business-meeting": [
    { icon: "📋", title: "Summarise often", body: "Restate key decisions every few minutes: 'So we've agreed that...'." },
    { icon: "🤝", title: "Acknowledge others", body: "Say 'That's a good point, and...' before adding your view." },
    { icon: "⏱️", title: "Time-box discussions", body: "Suggest timeboxes: 'Let's take 5 minutes on this, then move on'." },
  ],
  default: [
    { icon: "🗣️", title: "Speak clearly", body: "Slow down slightly. Clarity matters more than speed." },
    { icon: "📌", title: "Stay on topic", body: "Answer the question asked before expanding." },
    { icon: "✨", title: "Use examples", body: "Concrete examples are always more persuasive than abstract claims." },
    { icon: "🔤", title: "Rich vocabulary", body: "Vary your word choice — avoid repeating the same words." },
  ],
};

const SCENARIO_TITLES: Record<string, string> = {
  "job-interview": "Job Interview Practice",
  "business-meeting": "Business Meeting",
  "daily-convo": "Daily Conversation",
  "phone-call": "Phone Call",
  "salary-neg": "Salary Negotiation",
  "presentation": "Presentation Practice",
  "executive-comm": "Executive Communication",
  "email-to-speech": "Meeting Conflict Resolution",
};

export const Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const scenarioId: string = (location.state as any)?.scenarioId ?? "job-interview";
  const customPrompt: string | undefined = (location.state as any)?.customPrompt;

  const isPlayground = searchParams.get("playground") === "true";
  const [isEnding, setIsEnding] = useState(false);
  const [duration, setDuration] = useState(0);
  const [activeTip, setActiveTip] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const { profile, fetchProfile } = useProfileStore();
  const dailyGoalSeconds = (profile?.daily_goal_minutes || 15) * 60;
  const [timeLeft, setTimeLeft] = useState(dailyGoalSeconds);

  // Fetch profile on direct mount to ensure custom targets hydrate
  useEffect(() => {
    if (!profile) fetchProfile();
  }, [profile, fetchProfile]);

  // Hydrate the timer state cleanly when the profile loads from backend
  useEffect(() => {
    if (!sessionStarted && profile?.daily_goal_minutes) {
      setTimeLeft(profile.daily_goal_minutes * 60);
    }
  }, [profile?.daily_goal_minutes, sessionStarted]);

  const sessionIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Use a ref to break circular dependencies for interval cleanup
  const actionsRef = useRef({
    endSession: () => {},
  });

  const title = SCENARIO_TITLES[scenarioId] ?? "Practice Session";
  const tips = COACHING_TIPS[scenarioId] ?? COACHING_TIPS.default;

  // Create DB session on mount
  useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      try {
        const { data } = await api.POST<any>("/api/practice/sessions", {
          scenario_id: scenarioId,
          session_type: customPrompt ? "custom" : "preset",
          custom_prompt: customPrompt,
        });
        sessionIdRef.current = data.session_id;
      } catch {}

      if (isCancelled) return;
      setSessionStarted(true);
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
        setTimeLeft((prev) => {
          if (prev <= 1) {
            actionsRef.current.endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      tipRef.current = setInterval(() => setActiveTip((t) => (t + 1) % tips.length), 15000);
    };
    init();
    
    return () => {
      isCancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tipRef.current) clearInterval(tipRef.current);
    };
  }, [scenarioId, customPrompt]);

  const endSession = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tipRef.current) clearInterval(tipRef.current);

    const sid = sessionIdRef.current;
    if (!sid) {
      navigate("/practice");
      return;
    }

    // Wait 2 seconds so the Python Voice Agent has time to sync the final transcripts to the DB
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Score the transcript via AI 
      // (For voice agent, transcript will be empty here since backend handles WebRTC)
      const { data: scores } = await api.POST<any>("/api/chat/score", {
        scenario_id: scenarioId,
        transcript: [], 
        session_id: sid
      });

      let calculatedDuration = startTimeRef.current 
        ? Math.ceil((Date.now() - startTimeRef.current) / 60000)
        : Math.ceil(duration / 60);
        
      if (calculatedDuration < 1) calculatedDuration = 1;

      // Save scores to DB
      await api.PATCH(`/api/practice/sessions/${sid}/complete`, {
        duration_minutes: calculatedDuration,
        overall_score: scores.overall_score ?? 75,
        fluency_score: scores.fluency_score ?? 75,
        grammar_score: scores.grammar_score ?? 75,
        pronunciation_score: scores.pronunciation_score ?? 75,
        vocabulary_score: scores.vocabulary_score ?? 75,
        confidence_score: scores.confidence_score ?? 75,
        filler_count: scores.filler_count ?? 0,
        wpm: scores.wpm ?? 130,
        feedback_items: scores.feedback_items ?? [],
        vocabulary_saved: scores.vocabulary_saved ?? [],
      });

      navigate(`/report/${sid}`);
    } catch {
      navigate(`/report/${sid ?? "demo"}`);
    }
  }, [isEnding, duration, navigate, scenarioId]);

  // Update actionsRef on every render
  actionsRef.current.endSession = endSession;

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold",
              sessionStarted ? "text-emerald-700" : "text-amber-700")}
              style={{ background: sessionStarted ? "rgba(5,150,105,0.10)" : "rgba(217,119,6,0.10)" }}>
              <div className={cn("w-1.5 h-1.5 rounded-full", sessionStarted ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-pulse")} />
              {sessionStarted ? "Live" : "Starting…"}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{title}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: "var(--text-3)" }}>{fmt(timeLeft)}</span>
            <button onClick={endSession} disabled={isEnding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: isEnding ? "var(--text-3)" : "var(--red)" }}>
              {isEnding
                ? <><Loader2 size={12} className="animate-spin" style={{ pointerEvents: "all" }} /> Scoring…</>
                : <><PhoneOff size={12} style={{ pointerEvents: "all" }} /> End & Score</>
              }
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area - Full Voice Client */}
          <div className="flex-1 flex flex-col p-4 lg:p-6 bg-zinc-950 overflow-hidden">
            {sessionIdRef.current && (
              <LiveKitSession 
                scenarioId={scenarioId} 
                dbSessionId={sessionIdRef.current}
                maxMinutes={isPlayground ? 5 : undefined}
                onEnd={() => { 
                  if (!isEnding) endSession(); 
                }} 
              />
            )}
          </div>

          {/* Right: Coach Tips */}
          <div className="w-60 shrink-0 flex flex-col" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={13} style={{ pointerEvents: "all", color: "var(--accent)" }} />
                <p className="label" style={{ color: "var(--accent)" }}>Coach Tips</p>
              </div>
            </div>

            {/* Active tip */}
            <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="rounded-xl p-3" style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <p className="text-base mb-1.5">{tips[activeTip]?.icon}</p>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>{tips[activeTip]?.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{tips[activeTip]?.body}</p>
              </div>
            </div>

            {/* All tips */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              {tips.map((tip, i) => (
                <button key={i} onClick={() => setActiveTip(i)}
                  className={cn("w-full text-left p-2.5 rounded-xl flex items-start gap-2 transition-all")}
                  style={{ background: activeTip === i ? "var(--accent-dim)" : "transparent" }}>
                  <span className="text-sm shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: activeTip === i ? "var(--accent)" : "var(--text)" }}>{tip.title}</p>
                    <p className="text-[10px] leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--text-3)" }}>{tip.body}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => navigate("/practice")} className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-xl border transition-all hover:bg-[var(--bg)]"
                style={{ color: "var(--text-3)", borderColor: "var(--border)" }}>
                <RotateCcw size={11} style={{ pointerEvents: "all" }} /> Change Scenario
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
