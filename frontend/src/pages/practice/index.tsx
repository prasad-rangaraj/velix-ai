import { SidebarLayout, PageHeader } from "@/layouts/SidebarLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/utils";
import { cn } from "@/lib/utils";
import {
  Clock, ChevronRight, Briefcase, Users, Phone, MessageSquare,
  DollarSign, Presentation, Zap, Wand2, X, ArrowRight,
} from "lucide-react";

type Filter = "All" | "Beginner" | "Intermediate" | "Advanced" | "Professional" | "Job Seeker";
const FILTERS: Filter[] = ["All", "Beginner", "Intermediate", "Advanced", "Professional", "Job Seeker"];

const levelColor: Record<string, string> = {
  Beginner:     "bg-blue-100 text-blue-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced:     "bg-rose-100 text-rose-700",
  Professional: "bg-violet-100 text-violet-700",
  "Job Seeker": "bg-emerald-100 text-emerald-700",
};

interface Scenario {
  id: string; title: string; level: string; duration: string; description: string; skills: string[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  "job-interview": Briefcase,
  "business-meeting": Users,
  "daily-convo": MessageSquare,
  "phone-call": Phone,
  "salary-neg": DollarSign,
  "presentation": Presentation,
  "executive-comm": Briefcase,
  "email-to-speech": Users,
};

export const Practice = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("All");
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.GET<any>("/api/practice/scenarios")
      .then(({ data }) => { if (data?.scenarios?.length) setScenarios(data.scenarios); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? scenarios : scenarios.filter((s) => s.level === filter);

  return (
    <SidebarLayout>
      <div className="p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="label mb-1.5">Select a Scenario</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Practice Sessions</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>AI-powered real-world conversations with live feedback</p>
          </div>
        </div>

        {/* ── Quick Flash card (competitor gap: Duolingo forces long sessions) ── */}
        <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, var(--accent-dk), #7C3AED)", boxShadow: "0 4px 20px var(--accent-glow)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Zap size={22} className="text-white" style={{ pointerEvents: "all" }} />
            </div>
            <div>
              <p className="font-bold text-white text-base">5-Minute Flash Practice</p>
              <p className="text-white/70 text-sm mt-0.5">Quick targeted drill — no scenario setup needed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {["Fluency", "Grammar", "Vocabulary"].map((skill) => (
                <span key={skill} className="text-xs text-white/80 bg-white/15 px-2.5 py-1 rounded-full font-medium">{skill}</span>
              ))}
            </div>
            <button
              onClick={() => navigate("/session", { state: { scenarioId: "daily-convo" } })}
              className="bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              Start Now <ArrowRight size={14} style={{ pointerEvents: "all" }} />
            </button>
          </div>
        </div>

        {/* ── Custom scenario (competitor gap: ELSA/Duolingo rigid content) ── */}
        <div className="card mb-6">
          <button
            onClick={() => setCustomOpen(!customOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-dim)" }}>
                <Wand2 size={15} style={{ pointerEvents: "all", color: "var(--accent)" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Custom Scenario</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Describe any situation — our AI adapts to it instantly</p>
              </div>
            </div>
            <ChevronRight size={16} className={cn("transition-transform", customOpen && "rotate-90")}
              style={{ pointerEvents: "all", color: "var(--text-3)" }} />
          </button>
          {customOpen && (
            <div className="px-5 pb-5">
              <div className="h-px mb-4" style={{ background: "var(--border)" }} />
              <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-2)" }}>
                Describe your scenario (e.g. "I'm presenting a product demo to skeptical investors")
              </p>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your scenario here…"
                rows={3}
                className="input mb-3 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/session", { state: { scenarioId: "custom", customPrompt: customText.trim() } })}
                  disabled={!customText.trim()}
                  className="btn-primary px-5 py-2 text-sm flex-1">
                  Start Custom Session
                </button>
                <button onClick={() => { setCustomOpen(false); setCustomText(""); }}
                  className="btn-ghost px-3 py-2">
                  <X size={15} style={{ pointerEvents: "all" }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Filters — including Professional + Job Seeker ── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                filter === f
                  ? "text-white border-transparent shadow-[0_2px_8px_var(--accent-glow)]"
                  : "border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              )}
              style={filter === f ? { background: "var(--accent-dk)" } : { background: "var(--surface)", color: "var(--text-2)" }}>
              {f}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>{filtered.length} scenarios</span>
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="flex justify-center items-center py-10 opacity-60">
            <Wand2 size={24} className="animate-pulse text-indigo-500" style={{ pointerEvents: "all" }} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((s: Scenario) => {
              const Icon = ICON_MAP[s.id] ?? Briefcase;
            return (
              <div key={s.id} className="card card-hover group flex flex-col"
                onClick={() => navigate("/session", { state: { scenarioId: s.id } })}>
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: "var(--bg)" }}>
                      <Icon size={18} style={{ pointerEvents: "all", color: "var(--text-2)" }} />
                    </div>
                    <span className={cn("badge text-[11px]", levelColor[s.level] ?? "bg-gray-100 text-gray-600")}>{s.level}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1.5 transition-colors group-hover:text-[var(--accent)]"
                    style={{ color: "var(--text)" }}>{s.title}</h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>{s.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.skills.map((sk) => (
                      <span key={sk} className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                        style={{ background: "var(--bg)", color: "var(--text-3)" }}>{sk}</span>
                    ))}
                  </div>
                </div>
                <div className="px-5 pb-4 pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-3)" }}>
                    <Clock size={11} style={{ pointerEvents: "all" }} /> {s.duration}
                  </span>
                  <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                    Start <ChevronRight size={12} style={{ pointerEvents: "all" }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </SidebarLayout>
  );
};
