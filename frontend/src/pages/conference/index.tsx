import { useState, useRef, useEffect } from "react";
import { SidebarLayout } from "@/layouts/SidebarLayout";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Mic, MicOff, PhoneOff, Users, ChevronDown,
  Activity, Lightbulb, Video, VideoOff, Loader2
} from "lucide-react";
import { useConferenceStore } from "@/store/conference";

/* ── AI Personas ── */
interface Persona {
  id: string;
  name: string;
  role: string;
  emoji: string;
  personality: string;
  personalityColor: string;
  speaking: boolean;
  sentiment: "neutral" | "skeptical" | "positive" | "thinking";
}

const MEETING_TYPES = [
  { id: "standup",     label: "Team Standup",     prompt: "Daily team update — keep updates concise, blockers clear, tone energetic." },
  { id: "pitch",       label: "Client Pitch",      prompt: "Presenting a product to clients — build value, handle objections, close confidently." },
  { id: "board",       label: "Board Update",      prompt: "Executive presentation — data-driven, strategic, confident under scrutiny." },
  { id: "conflict",    label: "Conflict Resolution",prompt: "Navigate a disagreement between teams — empathy, logic, collaborative solution." },
  { id: "negotiation", label: "Negotiation",        prompt: "Salary or contract negotiation — assert your value, stay composed, find common ground." },
];

const PERSONAS: Persona[] = [
  { id: "director",  name: "Sarah Chen",     role: "Director, Product",    emoji: "👩‍💼", personality: "Decisive",   personalityColor: "var(--accent)", speaking: false, sentiment: "neutral" },
  { id: "skeptic",   name: "Marcus Reid",    role: "Head of Finance",      emoji: "🧑‍💼", personality: "Skeptic",    personalityColor: "var(--amber)",  speaking: false, sentiment: "skeptical" },
  { id: "ally",      name: "Priya Nair",     role: "Senior Manager",       emoji: "👩‍💻", personality: "Supportive", personalityColor: "var(--green)",  speaking: false, sentiment: "positive" },
  { id: "observer",  name: "Tom Xu",         role: "VP Engineering",       emoji: "👨‍🔬", personality: "Analytical", personalityColor: "var(--text-2)", speaking: false, sentiment: "thinking" },
];

const TIPS = [
  "Address the skeptic directly — acknowledge their concern before defending your point.",
  "Use specific numbers when speaking to the finance head. 'Around 20%' → 'exactly 18.4%'.",
  "Priya is nodding — build on her agreement to reinforce your position.",
  "Tom hasn't spoken. Ask for his technical perspective to show collaborative leadership.",
  "You've been talking for 90 seconds — pause, scan the room, invite a reaction.",
  "Match Sarah's directness. She responds well to clear 'ask-and-answer' structures.",
];


const SENTIMENT_ICON: Record<string, string> = { neutral: "😐", skeptical: "🤨", positive: "🙂", thinking: "🤔" };

export const ConferenceRoom = () => {
  const navigate = useNavigate();
  const { activeSessionId, transcript, isLoading, isEnding, startConference, addTranscriptTurn, endConference, fetchPastSessions } = useConferenceStore();
  const [meetingType, setMeetingType] = useState(MEETING_TYPES[0]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [personas, setPersonas] = useState(PERSONAS);
  const [anxietyLevel, setAnxietyLevel] = useState(35);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);
  const [tipsShown, setTipsShown] = useState(0);

  useEffect(() => {
    fetchPastSessions();
  }, [fetchPastSessions]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const startMeeting = async () => {
    await startConference(meetingType.label, personas.map(p => p.id));
    
    intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    tipRef.current = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
      setTipsShown((t) => t + 1);
    }, 10000);

    // Boot up Web Speech API
    const SpeechR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechR) {
      const rc = new SpeechR();
      rc.continuous = true;
      rc.interimResults = false;
      rc.lang = "en-US";
      
      rc.onresult = (e: any) => {
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
        }
        if (final.trim().length > 0) {
          addTranscriptTurn("You", final.trim(), anxietyLevel);
        }
      };
      
      rc.onend = () => { if (activeSessionId && !isEnding && !muted) rc.start(); };
      recogRef.current = rc;
      if (!muted) rc.start();
    }

    // Simulate AI speaking sequence
    const events = [
      { delay: 1500, persona: "director",  text: "Let's get started. The Q3 numbers are concerning — what's your proposal to turn this around?" },
      { delay: 8000, persona: "skeptic",   text: "Before we continue — what's the confidence level on these projections? I need more than estimates." },
      { delay: 16000, persona: "ally",     text: "I've seen the groundwork your team has done. Maybe walk us through the key initiatives you're prioritising?" },
      { delay: 24000, persona: "observer", text: "From a technical standpoint, what dependencies are we assuming? That affects timeline significantly." },
    ];

    events.forEach(({ delay, persona, text }) => {
      setTimeout(() => {
        const p = PERSONAS.find(x => x.id === persona);
        if (p) {
          setActiveSpeaker(persona);
          setAnxietyLevel((a) => Math.min(90, a + 8));
          addTranscriptTurn(p.name, text);
          setTimeout(() => setActiveSpeaker(null), 4000);
        }
      }, delay);
    });
  };

  useEffect(() => {
    if (recogRef.current) {
      if (muted) recogRef.current.stop();
      else recogRef.current.start();
    }
  }, [muted]);

  const endMeeting = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tipRef.current) clearInterval(tipRef.current);
    if (recogRef.current) recogRef.current.abort();
    
    await endConference(duration, 100 - anxietyLevel, tipsShown);
    navigate("/report/demo");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full" style={{ background: "#0D0F14" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ background: "#12151C", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            {/* Meeting type selector */}
            <div className="relative">
              <button onClick={() => !activeSessionId && setTypeOpen(!typeOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)" }}>
                {meetingType.label}
                {!activeSessionId && <ChevronDown size={13} style={{ pointerEvents: "all" }} />}
              </button>
              {typeOpen && (
                <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50 min-w-[200px] shadow-2xl"
                  style={{ background: "#1A1D2B", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {MEETING_TYPES.map((mt) => (
                    <button key={mt.id} onClick={() => { setMeetingType(mt); setTypeOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm transition-all"
                      style={{ color: meetingType.id === mt.id ? "var(--accent)" : "rgba(255,255,255,0.7)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      {mt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {activeSessionId && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(220, 38, 38, 0.15)", color: "#F87171" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {fmt(duration)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <>
                <button onClick={() => setCameraOff(!cameraOff)}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: cameraOff ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.08)", color: cameraOff ? "#F87171" : "rgba(255,255,255,0.7)" }}>
                  {cameraOff ? <VideoOff size={16} style={{ pointerEvents: "all" }} /> : <Video size={16} style={{ pointerEvents: "all" }} />}
                </button>
                <button onClick={() => setMuted(!muted)}
                  className="p-2 rounded-xl transition-all"
                  style={{ background: muted ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.08)", color: muted ? "#F87171" : "rgba(255,255,255,0.7)" }}>
                  {muted ? <MicOff size={16} style={{ pointerEvents: "all" }} /> : <Mic size={16} style={{ pointerEvents: "all" }} />}
                </button>
                <button onClick={endMeeting} disabled={isEnding}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#DC2626" }}>
                  {isEnding ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} style={{ pointerEvents: "all" }} />} 
                  {isEnding ? "Saving..." : "End Meeting"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Center: AI Grid + Controls */}
          <div className="flex-1 flex flex-col p-4 gap-4">

            {/* Persona video grid */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {personas.map((p) => {
                const isSpeaking = activeSpeaker === p.id;
                return (
                  <div key={p.id} className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center"
                    style={{
                      background: "#1A1D2B",
                      border: `2px solid ${isSpeaking ? (p.personalityColor === "var(--accent)" ? "#6366F1" : p.personalityColor === "var(--amber)" ? "#D97706" : "#059669") : "rgba(255,255,255,0.08)"}`,
                      boxShadow: isSpeaking ? `0 0 20px ${p.personalityColor === "var(--accent)" ? "rgba(99,102,241,0.3)" : "rgba(217,119,6,0.2)"}` : "none",
                      transition: "all 0.3s",
                    }}>

                    {/* Speaking ripple */}
                    {isSpeaking && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full animate-ping opacity-10"
                          style={{ background: p.personalityColor === "var(--accent)" ? "#6366F1" : "#D97706" }} />
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="text-5xl mb-2 relative z-10">{p.emoji}</div>
                    <div className="relative z-10 text-center px-3">
                      <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>{p.name}</p>
                      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{p.role}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                          {p.personality}
                        </span>
                        <span className="text-sm">{SENTIMENT_ICON[p.sentiment]}</span>
                      </div>
                    </div>

                    {/* Speaking indicator */}
                    {isSpeaking && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5 z-10">
                        {[3, 6, 10, 8, 5].map((h, i) => (
                          <div key={i} className="w-1 rounded-full animate-pulse"
                            style={{ height: `${h}px`, background: "#6366F1", animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    )}

                    {/* Corner role tag */}
                    <div className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.6)" }}>
                      {p.role.split(",")[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User tile + controls */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#1A1D2B", border: "2px solid rgba(99,102,241,0.4)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: "rgba(99,102,241,0.15)" }}>🎙️</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>You</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {muted ? "Microphone off" : activeSessionId ? "Your turn to speak" : "Ready to join"}
                  </p>
                </div>
                {!muted && activeSessionId && (
                  <div className="ml-auto flex items-end gap-0.5">
                    {[4, 8, 12, 8, 4].map((h, i) => (
                      <div key={i} className="w-1 rounded-full bg-indigo-400 animate-bounce"
                        style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>

              {!activeSessionId ? (
                <button onClick={startMeeting} disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white"
                  style={{ background: "#6366F1", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                  <Users size={16} style={{ pointerEvents: "all" }} />
                  Join Meeting
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setMuted(!muted)}
                    className="p-3 rounded-2xl transition-all"
                    style={{ background: muted ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.06)", color: muted ? "#F87171" : "rgba(255,255,255,0.5)" }}>
                    {muted ? <MicOff size={18} style={{ pointerEvents: "all" }} /> : <Mic size={18} style={{ pointerEvents: "all" }} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 shrink-0 flex flex-col"
            style={{ background: "#12151C", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>

            {/* Anxiety pulse */}
            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={13} style={{ pointerEvents: "all", color: "#818CF8" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4E6080" }}>Confidence Pulse</p>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${100 - anxietyLevel}%`, background: anxietyLevel > 70 ? "#F87171" : anxietyLevel > 50 ? "#FBBF24" : "#34D399" }} />
                </div>
                <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{100 - anxietyLevel}%</span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                {anxietyLevel > 70 ? "High pressure — breathe, slow down" : anxietyLevel > 50 ? "Moderate — stay grounded" : "Confident — keep going!"}
              </p>
            </div>

            {/* Live coaching tip */}
            <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={13} style={{ pointerEvents: "all", color: "#FBBF24" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4E6080" }}>Coach Tip</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {activeSessionId ? TIPS[tipIdx] : "Join the meeting to receive real-time coaching tips."}
                </p>
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4E6080" }}>Live Transcript</p>
              </div>
              <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {!activeSessionId && (
                  <p className="text-[11px] text-center py-8" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Transcript will appear here
                  </p>
                )}
                {transcript.map((line, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold mb-0.5"
                      style={{ color: line.speaker === "You" ? "#818CF8" : "rgba(255,255,255,0.4)" }}>
                      {line.speaker}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
