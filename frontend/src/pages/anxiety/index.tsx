import { useState, useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { cn } from "@/lib/utils";
import { Wind, Heart, Brain, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAnxietyStore } from "@/store/anxiety";

const ASSESSMENT = [
  { q: "Before an important meeting, I feel:",         options: ["Calm and prepared", "Slightly nervous but OK", "Very anxious", "Paralysed with dread"] },
  { q: "When asked an unexpected question, I:",        options: ["Answer confidently", "Pause, then recover", "Stammer and lose my point", "Go completely blank"] },
  { q: "After speaking in a group, I typically feel:", options: ["Energised and satisfied", "A bit self-critical", "Very self-critical", "Drained and embarrassed"] },
  { q: "My voice when nervous:",                       options: ["Stays steady", "Speeds up slightly", "Noticeably trembles", "I avoid speaking when nervous"] },
];

const ICONS: Record<string, any> = { cognitive_reframe: Brain, box_breathing: Wind, gradual_exposure: Heart };

export const AnxietyCoach = () => {
  const { latestAssessment, exercises, warmupSteps, isLoading, fetchInitialData, submitAssessment, logExercise } = useAnxietyStore();
  const [phase, setPhase] = useState<"assess" | "results" | "exercises">("assess");
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [openEx, setOpenEx] = useState<number | null>(null);
  const [warmupDone, setWarmupDone] = useState<boolean[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (latestAssessment && phase === "assess" && answers.length === 0) {
      setPhase("results");
    }
  }, [latestAssessment, phase, answers.length]);

  useEffect(() => {
    setWarmupDone(new Array(warmupSteps.length).fill(false));
  }, [warmupSteps.length]);

  const score = latestAssessment ? latestAssessment.score : Math.round((answers.reduce((s, a) => s + a, 0) / (ASSESSMENT.length * 3)) * 100);
  const anxietyPct = score || 0;
  
  const level = anxietyPct > 66 ? { label: "High", color: "var(--red)", bg: "rgba(220,38,38,0.08)", advice: "Focus on daily breathing exercises and gradual exposure therapy." }
    : anxietyPct > 33 ? { label: "Moderate", color: "var(--amber)", bg: "rgba(217,119,6,0.08)", advice: "Consistency is key — 5 min of CBT exercises daily makes a measurable difference." }
    : { label: "Low", color: "var(--green)", bg: "rgba(5,150,105,0.08)", advice: "Great baseline — focus on performance optimisation, not anxiety reduction." };

  const answer = async (optIdx: number) => {
    const next = [...answers, optIdx];
    setAnswers(next);
    if (current + 1 < ASSESSMENT.length) {
      setCurrent(current + 1);
    } else {
      await submitAssessment(next);
      setPhase("results");
    }
  };

  if (isLoading && phase === "assess") {
    return (
      <SidebarLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent)" }} />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-7 max-w-4xl mx-auto">
        <PageHeader title="Anxiety Coach" eyebrow="CBT-Backed Confidence Building" subtitle="Psychology-backed tools to reduce communication anxiety — used by executive coaches worldwide" />

        {phase === "assess" && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Communication Anxiety Assessment</p>
              <span className="label">{current + 1} / {ASSESSMENT.length}</span>
            </div>
            <div className="h-1.5 rounded-full mb-8" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${((current) / ASSESSMENT.length) * 100}%`, background: "var(--accent)" }} />
            </div>
            <p className="text-lg font-bold mb-6" style={{ color: "var(--text)" }}>{ASSESSMENT[current].q}</p>
            <div className="flex flex-col gap-2.5">
              {ASSESSMENT[current].options.map((opt, i) => (
                <button key={i} onClick={() => answer(i)}
                  className="text-left px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text-2)" }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "results" && (
          <div className="flex flex-col gap-5">
            <div className="card p-6 flex items-center gap-6" style={{ background: level.bg, border: `1px solid ${level.color}33` }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0"
                style={{ background: level.color + "22", color: level.color }}>
                {anxietyPct}%
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: level.color }}>Anxiety Level: {level.label}</p>
                <p className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>Your Communication Anxiety Score</p>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>{level.advice}</p>
              </div>
              <button onClick={() => setPhase("exercises")} className="btn-primary px-5 py-2.5 text-sm ml-auto shrink-0">
                Start Exercises →
              </button>
            </div>

            {/* Pre-session warm-up */}
            <Section title="Pre-Session Warm-Up Routine — Do This Before Every Practice">
              <div className="flex flex-col gap-2">
                {warmupSteps.map((step, i) => (
                  <button key={i} onClick={() => {
                      if (!warmupDone[i]) logExercise("warmup", step);
                      setWarmupDone((d) => { const n = [...d]; n[i] = !n[i]; return n; });
                    }}
                    className={cn("flex items-center gap-3 p-3 rounded-xl text-left transition-all border",
                      warmupDone[i] ? "opacity-60" : "")}
                    style={{ borderColor: warmupDone[i] ? "rgba(5,150,105,0.3)" : "var(--border)", background: warmupDone[i] ? "rgba(5,150,105,0.05)" : "var(--bg)" }}>
                    <span className="text-xl shrink-0">✨</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step}</p>
                    </div>
                    {warmupDone[i] && <CheckCircle2 size={16} style={{ pointerEvents: "all", color: "var(--green)", flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {phase === "exercises" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Daily 10-minute routine — evidence-based techniques from CBT and Acceptance & Commitment Therapy (ACT)</p>
            {exercises.map((ex, i) => {
              const Icon = ICONS[ex.id] || Brain;
              const isOpen = openEx === i;
              return (
                <div key={i} className="card overflow-hidden">
                  <button onClick={() => {
                        setOpenEx(isOpen ? null : i);
                        if (!isOpen) logExercise(ex.id);
                    }}
                    className="w-full flex items-center gap-4 p-5 text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--accent-dim)" }}>
                      <Icon size={18} style={{ pointerEvents: "all", color: "var(--accent)" }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{ex.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{ex.description}</p>
                    </div>
                    {ex.duration && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: "var(--bg)", color: "var(--text-3)" }}>{ex.duration}</span>
                    )}
                    <ChevronRight size={14} className={cn("shrink-0 transition-transform", isOpen && "rotate-90")}
                      style={{ pointerEvents: "all", color: "var(--text-3)" }} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--border)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mt-4 mb-3" style={{ color: "var(--accent)" }}>Steps</p>
                      <div className="flex flex-col gap-2.5">
                        {ex.steps.map((step, j) => (
                          <div key={j} className="flex gap-3 items-start">
                            <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{j + 1}</span>
                            <p className="text-sm" style={{ color: "var(--text)" }}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => setPhase("results")} className="text-xs self-center" style={{ color: "var(--text-3)" }}>← Back to results</button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
