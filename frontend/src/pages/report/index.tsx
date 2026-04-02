import { SidebarLayout, Section, ProgressBar } from "@/layouts/SidebarLayout";
import { ScoreRing } from "@/components/ScoreRing";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, RotateCcw, Share2, CheckCircle2, AlertTriangle, Info, Flag, ChevronDown, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip,
} from "chart.js";
import { api } from "@/utils";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const markColor = {
  warning: { bg: "rgba(251,191,36,0.15)", text: "#92400E" },
  error:   { bg: "rgba(248,113,113,0.15)", text: "#991B1B" },
  info:    { bg: "rgba(129,140,248,0.12)", text: "var(--accent)" },
};
const issueStyle = {
  warning: { border: "rgba(251,191,36,0.3)",   bg: "rgba(251,191,36,0.06)", Icon: AlertTriangle, ic: "#D97706" },
  error:   { border: "rgba(248,113,113,0.3)",   bg: "rgba(248,113,113,0.06)", Icon: Flag,          ic: "var(--red)" },
  info:    { border: "rgba(129,140,248,0.25)",  bg: "var(--accent-dim)",      Icon: Info,          ic: "var(--accent)" },
};

const Delta = ({ now, prev }: { now: number; prev: number }) => {
  const diff = now - (prev ?? now);
  if (!prev || diff === 0) return <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-3)" }}><Minus size={10} style={{ pointerEvents: "all" }} /> Same</span>;
  return (
    <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: diff > 0 ? "var(--green)" : "var(--red)" }}>
      {diff > 0 ? <TrendingUp size={11} style={{ pointerEvents: "all" }} /> : <TrendingDown size={11} style={{ pointerEvents: "all" }} />}
      {diff > 0 ? "+" : ""}{diff} pts
    </span>
  );
};

// Static fallback used when session is "demo" or data not found
const DEMO_REPORT = {
  overall_score: 78,
  scores: { fluency: 82, grammar: 71, pronunciation: 85, vocabulary: 74, confidence: 76 },
  prev_scores: { fluency: 74, grammar: 68, pronunciation: 79, vocabulary: 65, confidence: 70 },
  filler_count: 7, wpm: 138,
  feedback_items: [
    { type: "warning", text: "Filler words overused", fix: "Replace 'basically' with a brief pause." },
    { type: "error",   text: "Article usage error",   fix: "'Information' is uncountable — drop the 'a'." },
    { type: "info",    text: "Limited vocabulary variety", fix: "Try 'significant outcome' instead of 'good result'." },
  ],
  vocabulary_saved: ["articulate", "facilitate", "proactive"],
};

export const Report = () => {
  const navigate = useNavigate();
  const { id: sessionId } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId || sessionId === "demo") {
      setReport(DEMO_REPORT);
      setIsLoading(false);
      return;
    }
    api.GET<any>(`/api/practice/sessions/${sessionId}/report`)
      .then(({ data }) => setReport(data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  if (isLoading) return (
    <SidebarLayout>
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--accent)" }} />
      </div>
    </SidebarLayout>
  );

  if (error || !report) return (
    <SidebarLayout>
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <AlertTriangle size={36} className="text-amber-500" />
        <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>Report Not Found</p>
        <p className="text-sm mb-2" style={{ color: "var(--text-3)" }}>We couldn't load the report for this session.</p>
        <button onClick={() => navigate("/practice")} className="btn-primary px-4 py-2 text-sm">Return to Practice</button>
      </div>
    </SidebarLayout>
  );

  const R = report;
  const scores = R.scores;
  const prevScores = R.prev_scores ?? {};
  const feedbackItems: any[] = R.feedback_items ?? [];
  const vocabSaved: string[] = R.vocabulary_saved ?? [];

  const radarData = {
    labels: ["Fluency", "Grammar", "Pronunciation", "Vocabulary", "Confidence"],
    datasets: [
      {
        label: "This Session",
        data: [scores.fluency, scores.grammar, scores.pronunciation, scores.vocabulary, scores.confidence],
        backgroundColor: "rgba(99,102,241,0.15)",
        borderColor: "rgba(99,102,241,0.8)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(99,102,241,1)",
        pointRadius: 4,
      },
      {
        label: "Previous Session",
        data: [prevScores.fluency, prevScores.grammar, prevScores.pronunciation, prevScores.vocabulary, prevScores.confidence],
        backgroundColor: "rgba(99,102,241,0.05)",
        borderColor: "rgba(99,102,241,0.3)",
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointBackgroundColor: "rgba(99,102,241,0.4)",
        pointRadius: 3,
      },
    ],
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true, max: 100,
        grid: { color: "rgba(99,102,241,0.1)" },
        angleLines: { color: "rgba(99,102,241,0.1)" },
        pointLabels: { color: "var(--text-2)", font: { size: 11, family: "'Plus Jakarta Sans'" } },
        ticks: { display: false, stepSize: 25 },
      },
    },
  };

  return (
    <SidebarLayout>
      <div className="p-7 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate("/")} className="btn-ghost p-2 mt-0.5">
              <ArrowLeft size={16} style={{ pointerEvents: "all" }} />
            </button>
            <div>
              <p className="label mb-1">
                {R.created_at ? new Date(R.created_at).toLocaleDateString() : `Session Report${sessionId && sessionId !== "demo" ? ` #${sessionId}` : ""}`}
                {R.duration_minutes ? ` • ${R.duration_minutes} min` : ""}
              </p>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                {R.scenario_title ?? "Practice Session"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"><Share2 size={13} style={{ pointerEvents: "all" }} /> Share</button>
            <button onClick={() => navigate("/session")} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"><RotateCcw size={13} style={{ pointerEvents: "all" }} /> Practice Again</button>
          </div>
        </div>

        {/* Score hero */}
        <div className="card p-6 mb-5">
          <div className="flex items-stretch gap-8">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={R.overall_score} size={104} strokeWidth={8} label="Overall Score" color="#6366F1" />
              <Delta now={R.overall_score} prev={Object.values(prevScores).reduce((a: number, b: any) => a + b, 0) / 5} />
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>vs. last session</p>
            </div>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <div className="flex flex-wrap justify-center sm:justify-between flex-1 gap-2 min-w-[280px]">
              {Object.entries(scores).map(([k, v]) => (
                <div key={k} className="flex flex-col items-center gap-1">
                  <ScoreRing value={v as number} size={64} strokeWidth={6} label={k.charAt(0).toUpperCase() + k.slice(1)} color="#6366F1" />
                  <Delta now={v as number} prev={(prevScores as any)[k] ?? 0} />
                </div>
              ))}
            </div>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <div className="w-44 h-44 shrink-0">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-5">
          {/* Stats + vocab saved */}
          <Section title="Session Stats">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-2)" }}>Filler words</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{R.filler_count ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-2)" }}>Words / min</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{R.wpm ?? "—"}</span>
              </div>
              {vocabSaved.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-3)" }}>Words saved to vocab</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vocabSaved.map((w: string) => (
                      <span key={w} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Feedback / Improvements */}
          <Section title="Feedback — tap to expand" className="col-span-2">
            <div className="flex flex-col gap-2.5">
              {feedbackItems.length === 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: "var(--green)" }} />
                  <p className="text-sm" style={{ color: "var(--text)" }}>No major issues found — great session!</p>
                </div>
              )}
              {feedbackItems.map((item: any, i: number) => {
                const type = (item.type ?? "info") as keyof typeof issueStyle;
                const st = issueStyle[type] ?? issueStyle.info;
                const Icon = st.Icon;
                const isOpen = expanded === i;
                return (
                  <div key={i} className="rounded-xl border overflow-hidden" style={{ background: st.bg, borderColor: st.border }}>
                    <button onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-3 gap-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} style={{ pointerEvents: "all", color: st.ic, flexShrink: 0 }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{item.text}</p>
                          {item.fix && <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{typeof item.fix === "string" ? item.fix : item.fix[0]}</p>}
                        </div>
                      </div>
                      <ChevronDown size={14} className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}
                        style={{ pointerEvents: "all", color: "var(--text-3)" }} />
                    </button>
                    {isOpen && item.fix && (
                      <div className="px-4 pb-3 pt-1" style={{ borderTop: `1px solid ${st.border}` }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: st.ic }}>How to Fix</p>
                        <ul className="flex flex-col gap-1.5">
                          {(Array.isArray(item.fix) ? item.fix : [item.fix]).map((tip: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                              <span className="shrink-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
                                style={{ background: "rgba(99,102,241,0.12)", color: "var(--accent)" }}>{j + 1}</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Skill breakdown */}
        <Section title="Skill Breakdown">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(scores).map(([k, v]) => (
              <ProgressBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v as number} />
            ))}
          </div>
        </Section>
      </div>
    </SidebarLayout>
  );
};
