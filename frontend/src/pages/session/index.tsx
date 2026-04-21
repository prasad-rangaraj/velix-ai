import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/layouts/SidebarLayout";
import { Send, PhoneOff, Lightbulb, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/utils";
import { LiveKitSession } from "./LiveKitSession";
import { useProfileStore } from "@/store";

interface Message { role: "user" | "assistant"; content: string; }

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const isPlayground = searchParams.get("playground") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [duration, setDuration] = useState(0);
  const [activeTip, setActiveTip] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [mode, setMode] = useState<"chat" | "call">("call");

  const { profile, fetchProfile } = useProfileStore();
  const dailyGoalSeconds = (profile?.daily_goal_minutes || 15) * 60;
  const [timeLeft, setTimeLeft] = useState(dailyGoalSeconds);

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [profile, fetchProfile]);

  useEffect(() => {
    if (!sessionStarted && profile?.daily_goal_minutes) {
      setTimeLeft(profile.daily_goal_minutes * 60);
    }
  }, [profile?.daily_goal_minutes, sessionStarted]);

  const sessionIdRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const actionsRef = useRef({ endSession: () => {} });

  const title = SCENARIO_TITLES[scenarioId] ?? "Practice Session";
  const tips = COACHING_TIPS[scenarioId] ?? COACHING_TIPS.default;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Create DB session and get initial AI greeting on mount
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

      // Only fetch the AI greeting for text chat mode startup
      try {
        setIsLoading(true);
        const { data: chatData } = await api.POST<any>("/api/chat/chat", {
          scenario_id: scenarioId,
          custom_prompt: customPrompt,
          messages: [],
        });
        if (isCancelled) return;
        const opening: Message = { role: "assistant", content: chatData.reply };
        setMessages([opening]);
        saveTurn("ai", opening.content);
      } catch {
        if (isCancelled) return;
        setMessages([{ role: "assistant", content: "Hello! I'm ready to start your practice session. Please begin when you're ready." }]);
      } finally {
        if (isCancelled) return;
        setIsLoading(false);
        setSessionStarted(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
          setDuration((d) => d + 1);
          setTimeLeft((prev) => {
            if (prev <= 1) { actionsRef.current.endSession(); return 0; }
            return prev - 1;
          });
        }, 1000);
        tipRef.current = setInterval(() => setActiveTip((t) => (t + 1) % tips.length), 15000);
      }
    };
    init();
    return () => {
      isCancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tipRef.current) clearInterval(tipRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, customPrompt]);

  const saveTurn = (speaker: "user" | "ai", text: string) => {
    if (!sessionIdRef.current) return;
    api.POST(`/api/practice/sessions/${sessionIdRef.current}/turns`, {
      speaker, transcript: text,
    }).catch(() => {});
  };

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = overrideText ?? input.trim();
    if (!text || isLoading || isEnding) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!overrideText) setInput("");
    setIsLoading(true);
    saveTurn("user", text);

    try {
      const { data } = await api.POST<any>("/api/chat/chat", {
        scenario_id: scenarioId,
        custom_prompt: customPrompt,
        messages: nextMessages,
      });
      const aiMsg: Message = { role: "assistant", content: data.reply };
      setMessages((m) => [...m, aiMsg]);
      saveTurn("ai", aiMsg.content);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I'm sorry, I had trouble responding. Please try again." }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, messages, isLoading, isEnding, scenarioId, customPrompt]);

  const endSession = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tipRef.current) clearInterval(tipRef.current);

    const sid = sessionIdRef.current;
    if (!sid) { navigate("/practice"); return; }

    // Wait for voice agent to flush transcripts to DB
    await new Promise(r => setTimeout(r, 2000));

    try {
      const { data: scores } = await api.POST<any>("/api/chat/score", {
        scenario_id: scenarioId,
        // For text chat: pass the messages. For voice: pass [] and score via session_id.
        transcript: mode === "chat" ? messages.slice(1) : [],
        session_id: sid,
      });

      let calculatedDuration = startTimeRef.current
        ? Math.ceil((Date.now() - startTimeRef.current) / 60000)
        : Math.ceil(duration / 60);
      if (calculatedDuration < 1) calculatedDuration = 1;

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
        patterns_meta: scores.patterns_meta ?? null,
      });

      navigate(`/report/${sid}`);
    } catch {
      navigate(`/report/${sid ?? "demo"}`);
    }
  }, [isEnding, messages, duration, navigate, scenarioId, mode]);

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

          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl shadow-sm border border-[var(--border)]">
            <button onClick={() => setMode("chat")}
              className={cn("px-4 py-1.5 text-xs font-semibold rounded-lg transition-all", mode === "chat" ? "bg-indigo-600 text-white shadow-md" : "text-[var(--text-3)] hover:text-[var(--text)]")}>
              Text Chat
            </button>
            <button onClick={() => setMode("call")}
              className={cn("px-4 py-1.5 text-xs font-semibold rounded-lg transition-all", mode === "call" ? "bg-emerald-600 text-white shadow-md" : "text-[var(--text-3)] hover:text-[var(--text)]")}>
              Voice Call
            </button>
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
          {mode === "call" ? (
            <div className="flex-1 flex flex-col p-4 lg:p-6 bg-zinc-950 overflow-hidden">
              {sessionIdRef.current && (
                <LiveKitSession
                  scenarioId={scenarioId}
                  dbSessionId={sessionIdRef.current}
                  maxMinutes={isPlayground ? 5 : undefined}
                  onEnd={() => { if (!isEnding) endSession(); }}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                      style={{
                        background: msg.role === "assistant" ? "var(--accent-dk)" : "var(--bg)",
                        border: "1px solid var(--border)",
                        color: msg.role === "assistant" ? "white" : "var(--text-2)",
                      }}>
                      {msg.role === "assistant" ? "AI" : "Me"}
                    </div>
                    <div className="max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: msg.role === "assistant" ? "var(--surface)" : "linear-gradient(135deg, #6366F1, #818CF8)",
                        color: msg.role === "assistant" ? "var(--text)" : "white",
                        border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                      }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: "var(--accent-dk)", border: "1px solid var(--border)" }}>AI</div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: "var(--text-3)", animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
                {!sessionStarted ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm" style={{ color: "var(--text-3)" }}>
                    <Loader2 size={15} className="animate-spin" style={{ pointerEvents: "all" }} />
                    Starting your session…
                  </div>
                ) : (
                  <div className="flex gap-3 items-end">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type your response…"
                      className="input flex-1"
                      disabled={isLoading || isEnding}
                      autoFocus
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading || isEnding}
                      className="btn-primary px-4 py-2.5 text-sm shrink-0"
                    >
                      <Send size={14} style={{ pointerEvents: "all" }} />
                    </button>
                  </div>
                )}
                <p className="text-[10px] mt-2 text-center" style={{ color: "var(--text-3)" }}>
                  Press Enter to send · Click "End & Score" when done to see your full report
                </p>
              </div>
            </div>
          )}

          {/* Right: Coach Tips */}
          <div className="w-60 shrink-0 flex flex-col" style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={13} style={{ pointerEvents: "all", color: "var(--accent)" }} />
                <p className="label" style={{ color: "var(--accent)" }}>Coach Tips</p>
              </div>
            </div>

            <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="rounded-xl p-3" style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <p className="text-base mb-1.5">{tips[activeTip]?.icon}</p>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>{tips[activeTip]?.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{tips[activeTip]?.body}</p>
              </div>
            </div>

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
