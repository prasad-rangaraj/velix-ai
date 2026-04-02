import { useState, useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { Briefcase, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInterviewStore } from "@/store/interview";

const weightColor = { high: "var(--red)", medium: "var(--amber)", low: "var(--green)" };
const weightBg    = { high: "rgba(220,38,38,0.08)", medium: "rgba(217,119,6,0.08)", low: "rgba(5,150,105,0.08)" };

const DEMO_JD = `Senior Product Manager — Growth

We're looking for an experienced PM who can own the full product lifecycle for our growth initiatives. You'll work cross-functionally with engineering, design, and data teams to ship high-impact features that drive user acquisition and retention. 

You're data-driven, autonomous, and communicate with clarity across all levels of the organisation. You've scaled products at a fast-growing startup and know how to operate with ambiguity.

Responsibilities:
- Define and execute the product roadmap for growth
- Partner with engineering to ship scalable solutions
- Align stakeholders across product, marketing, and engineering
- Report on OKRs to leadership weekly`;

export const InterviewRoom = () => {
  const { activeSessionId, questions, cultureSignals, domainVocab, isLoading, analyzeJD, reset, fetchPastSessions } = useInterviewStore();
  const [jd, setJd] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchPastSessions();
  }, [fetchPastSessions]);

  const handleGenerate = () => {
    if (jd.trim().length > 30) analyzeJD(jd);
  };

  const loadDemo = () => { setJd(DEMO_JD); };

  return (
    <SidebarLayout>
      <div className="p-7 max-w-6xl mx-auto">
        <PageHeader
          title="Interview Room"
          eyebrow="AI-Powered Personalised Prep"
          subtitle="Paste any job description — AI generates questions, company culture signals, and vocabulary specific to YOUR target role"
        />

        {!activeSessionId && !isLoading && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Job Description</p>
                <button onClick={loadDemo} className="text-xs font-semibold transition-all"
                  style={{ color: "var(--accent)" }}>Load demo JD →</button>
              </div>
              <textarea
                value={jd} onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here…"
                rows={18} className="input resize-none w-full text-sm leading-relaxed"
              />
              <button onClick={handleGenerate} disabled={jd.trim().length < 30 || isLoading}
                className="btn-primary mt-3 w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} style={{ pointerEvents: "all" }} />}
                {isLoading ? "Analyzing Requirements..." : "Generate Personalised Prep Pack"}
              </button>
            </div>
            <div className="card p-6 flex flex-col items-center justify-center gap-3 text-center"
              style={{ border: "2px dashed var(--border)" }}>
              <Briefcase size={32} style={{ pointerEvents: "all", color: "var(--text-3)" }} />
              <p className="font-semibold" style={{ color: "var(--text-2)" }}>Paste a job description on the left</p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>AI will extract key competencies, generate 7–12 personalised interview questions, and signal the company's communication culture.</p>
            </div>
          </div>
        )}
        
        {isLoading && !activeSessionId && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-3)] gap-3">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Synthesizing Job Description and formulating questions...</p>
          </div>
        )}

        {activeSessionId && !isLoading && (
          <div className="grid grid-cols-3 gap-5">
            {/* Company signals */}
            <div className="flex flex-col gap-4">
              <Section title="Company Culture Signals">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Culture tone", value: cultureSignals?.tone ? cultureSignals.tone.charAt(0).toUpperCase() + cultureSignals.tone.slice(1) : "Professional" },
                    { label: "Seniority level", value: cultureSignals?.seniority ? cultureSignals.seniority.charAt(0).toUpperCase() + cultureSignals.seniority.slice(1) : "Mid" },
                    { label: "Environment", value: cultureSignals?.is_startup ? "Fast-paced / Startup" : cultureSignals?.is_corp ? "Enterprise / Corporate" : "Balanced" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Domain Vocabulary to Use">
                <div className="flex flex-wrap gap-1.5">
                  {domainVocab.map((v) => (
                    <span key={v} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{v}</span>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>These appear frequently in the JD — use them naturally in your answers.</p>
              </Section>

              <button onClick={reset} className="btn-secondary text-sm py-2">
                ← New Job Description
              </button>
            </div>

            {/* Questions */}
            <div className="col-span-2">
              <Section title={`${questions.length} Personalised Questions — Weighted by JD Relevance`}>
                <div className="flex flex-col gap-2">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                      <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-[var(--bg)] transition-colors">
                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "var(--bg)", color: "var(--text-2)" }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug" style={{ color: "var(--text)" }}>{q.q}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: weightBg[q.weight], color: weightColor[q.weight] }}>
                              {q.weight} priority
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} className={cn("shrink-0 mt-1 transition-transform", openIdx === i && "rotate-90")}
                          style={{ pointerEvents: "all", color: "var(--text-3)" }} />
                      </button>
                      {openIdx === i && (
                        <div className="px-4 pb-3.5 pt-1" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--accent)" }}>STAR Hint</p>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{q.star_hint}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
