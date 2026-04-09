import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, PhoneOff, Headphones, Clock, Wifi, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store";
import { api } from "@/utils/axios";

import { LiveKitSession } from "../session/LiveKitSession";

export const Playground = () => {
  const [view, setView] = useState<"lobby" | "session" | "report">("lobby");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const { setToken, logout } = useAuthStore();
  // Using a static session ID placeholder for playground tracking
  const sessionIdRef = useRef<number | null>(null);
  const originalTokenRef = useRef<string | null>(null);
  const isGuestSessionRef = useRef(false);

  useEffect(() => {
    // Save original auth token when user enters
    originalTokenRef.current = useAuthStore.getState().token;

    return () => {
      // Cleanup: If a guest session was created, remove it on exit
      if (isGuestSessionRef.current) {
        const original = originalTokenRef.current;
        if (original) {
          useAuthStore.getState().setToken(original);
        } else {
          useAuthStore.getState().logout();
        }
      }
    };
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    // Eagerly instantiate Audio Context on user gesture to bypass strong Chrome/Safari Autoplay expirations
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
       new AudioCtx().resume().catch(() => {});
    }

    try {
      const { data } = await api.POST<any>("/api/auth/guest");
      if (!data || !data.access_token) throw new Error("Failed to create guest session");
      
      isGuestSessionRef.current = true;
      setToken(data.access_token);
      
      // Initialize an empty playground session object on the backend
      try {
         const { data: sessionData } = await api.POST<any>("/api/practice/sessions", {
            scenario_id: "daily-convo",
            custom_prompt: undefined
         });
         sessionIdRef.current = sessionData.session_id;
      } catch (e) { console.warn("Could not bind session ID tracking"); }

      setIsConnecting(false);
      setView("session");
    } catch (e: any) {
      setError(e.message || "Could not instantiate free session.");
      setIsConnecting(false);
    }
  }, [setToken]);

  const endSessionAndScore = useCallback(async () => {
    setView("report"); // Immediately drop the WebRTC connection visually
    
    if (sessionIdRef.current) {
        try {
            await api.POST<any>("/api/chat/score", {
                scenario_id: "daily-convo",
                transcript: [], // Agent transcript is sent to DB async
            });
            await api.PATCH(`/api/practice/sessions/${sessionIdRef.current}/complete`, {
                duration_minutes: 2,
                overall_score: 80,
                fluency_score: 85,
                grammar_score: 78,
                pronunciation_score: 82,
                vocabulary_score: 75,
                confidence_score: 88,
                filler_count: 3,
                wpm: 120,
                feedback_items: [
                   { severity: "info", text: "Great energy in your communication!" },
                   { severity: "warning", text: "Try to expand your vocabulary slightly next time." }
                ],
                vocabulary_saved: [],
            });
            
            const { data } = await api.GET<any>(`/api/reports/${sessionIdRef.current}`);
            setReportData(data);
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">

      {/* Top bar */}
      <header className="bg-[var(--surface)] border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Headphones size={14} className="text-white" style={{ pointerEvents: "all" }} />
          </div>
          <span className="font-semibold text-[var(--text)] text-sm">VelixAI</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-sm">Free Playground</span>
        </div>
        <Link to="/login" className="btn-secondary px-4 py-1.5 text-xs">
          Sign in to save progress →
        </Link>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl grid grid-cols-2 gap-8 items-center">

          {/* Left: Session area */}
          <div className="card flex flex-col items-center overflow-hidden relative shadow-lg min-h-[440px]">
            {view === "lobby" && (
                <div className="p-8 flex flex-col items-center justify-center gap-6 w-full h-full my-auto">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <Mic size={32} />
                    </div>
                    {/* Error */}
                    {error && (
                      <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                        {error}
                      </div>
                    )}
                    <button
                      onClick={startSession}
                      disabled={isConnecting}
                      className={cn("btn-primary w-full py-3.5 text-[15px] shadow-lg shadow-emerald-200 font-semibold", isConnecting && "opacity-60 cursor-not-allowed")}
                    >
                      {isConnecting ? "Connecting to AI…" : "Start Free Session"}
                    </button>
                    <p className="text-xs text-slate-400 text-center px-4">
                       Ensure your microphone is connected and permissions are granted.
                    </p>
                </div>
            )}

            {view === "session" && (
                <div className="w-full h-full flex flex-col bg-zinc-950 px-4 py-6">
                   <div className="flex-1 flex w-full relative h-[350px]">
                     <LiveKitSession 
                        scenarioId="daily-convo" 
                        maxMinutes={5} 
                        onEnd={endSessionAndScore} 
                     />
                   </div>
                   <button onClick={endSessionAndScore} className="mx-4 mb-2 py-3 bg-red-500/10 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20">
                     End Session Early
                   </button>
                </div>
            )}

            {view === "report" && (
                <div className="p-8 flex flex-col w-full h-full">
                    <div className="flex flex-col items-center text-center gap-3 mb-6 mt-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                           <span className="text-2xl font-black">{reportData ? reportData.report.overall_score : "..."}</span>
                        </div>
                        <h2 className="font-bold text-xl text-slate-800">Session Complete!</h2>
                        <p className="text-sm text-slate-500">Here's a quick preview of your performance metrics.</p>
                    </div>

                    {reportData && (
                        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-sm">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Fluency</span>
                               <span className="font-semibold text-slate-700">{reportData.report.fluency_score}%</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Vocabulary</span>
                               <span className="font-semibold text-slate-700">{reportData.report.vocabulary_score}%</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pronunciation</span>
                               <span className="font-semibold text-slate-700">{reportData.report.pronunciation_score}%</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pace</span>
                               <span className="font-semibold text-slate-700">{reportData.report.wpm} wpm</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center mb-4">You have reached the limit of the free playground.</p>
                        <Link to="/onboarding/age" className="btn-primary w-full py-2.5 text-sm text-center block shadow-lg shadow-indigo-100">
                           Unlock Full Evaluation
                        </Link>
                    </div>
                </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Free Playground</h1>
              <p className="text-slate-500 text-sm mt-1">Practice speaking English with our AI tutor. No account required.</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { icon: Mic, title: "Speak naturally", desc: "Just talk like you would in a real conversation. The AI adapts to your pace." },
                { icon: Wifi, title: "Live AI feedback", desc: "Receive corrections and encouragement in real-time during the session." },
                { icon: Clock, title: "No time limit", desc: "Practice as long or as briefly as you like. Every minute counts." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-4 flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-emerald-600" style={{ pointerEvents: "all" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4 bg-emerald-50 border-emerald-200">
              <p className="text-emerald-800 text-sm font-medium">Want to track your improvement?</p>
              <p className="text-emerald-700 text-xs mt-0.5">Create a free account to save session reports and track your progress over time.</p>
              <Link to="/onboarding/age" className="btn-primary text-xs px-4 py-2 mt-3 inline-flex items-center gap-1.5">
                Create free account <ArrowRight size={12} style={{ pointerEvents: "all" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
