import { SidebarLayout, MetricCard, ProgressBar, Section } from "@/layouts/SidebarLayout";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHomeStore } from "@/store/home";
import { Flame, Zap, Target, BookOpen, ArrowRight, CheckCircle2, Clock, ChevronRight } from "lucide-react";

export const Home = () => {
  const { streak, xp, dailyGoal, skills, recentSessions, roadmap, fetchDashboard } = useHomeStore();
  const navigate = useNavigate();
  useEffect(() => { fetchDashboard(); }, []);
  const done = dailyGoal.current >= dailyGoal.target;
  const scoreColor = (s: number) => s >= 80 ? "var(--green)" : s >= 65 ? "var(--amber)" : "var(--red)";
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <SidebarLayout>
      <div className="p-7">
        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="label mb-1.5">{dateStr}</p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{greeting} 👋</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              {streak.count > 0 ? `${streak.count}-day streak — keep it going!` : "Start your first session today!"}
            </p>
          </div>
          <button onClick={() => navigate("/practice")} className="btn-primary px-5 py-2.5 text-sm">
            Start Session <ArrowRight size={14} style={{ pointerEvents: "all" }} />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard label="Streak" value={streak.count > 0 ? `${streak.count} days` : "—"} sub="Keep it going" icon={Flame} />
          <MetricCard label="Total XP" value={xp.count} sub="Earned from sessions" icon={Zap} accent />
          <MetricCard label="Daily Goal" value={done ? "Completed" : `${dailyGoal.current}/${dailyGoal.target} min`} sub={done ? "All done today!" : `${dailyGoal.percentage}% done`} icon={Target} />
          <MetricCard label="Sessions" value={recentSessions.length} sub="Recent" icon={BookOpen} />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 flex flex-col gap-5">

            {/* Recent sessions — from DB */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Recent Sessions</p>
                <button onClick={() => navigate("/progress")} className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  View all <ChevronRight size={12} style={{ pointerEvents: "all" }} />
                </button>
              </div>
              {recentSessions.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-3)" }}>No sessions yet — start your first practice!</p>
                  <button onClick={() => navigate("/practice")} className="btn-primary px-4 py-2 text-xs mt-3">Start Now →</button>
                </div>
              ) : recentSessions.map((s: any, i: number) => (
                <div key={s.id ?? i} className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: i < recentSessions.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: scoreColor(s.overall_score ?? s.score ?? 0) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {s.scenario_id ?? s.title ?? "Practice Session"}
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                      <Clock size={10} style={{ pointerEvents: "all" }} />
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: scoreColor(s.overall_score ?? s.score ?? 0) }}>
                      {s.overall_score ?? s.score ?? "—"}<span className="text-xs font-normal" style={{ color: "var(--text-3)" }}>/100</span>
                    </p>
                    {s.id && (
                      <button onClick={() => navigate(`/report/${s.id}`)} className="text-xs" style={{ color: "var(--accent)" }}>Report →</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Daily goal */}
            <div className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Daily Goal</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                    {done ? "Goal achieved — great work!" : `${dailyGoal.target - dailyGoal.current} more minutes to target`}
                  </p>
                </div>
                <div className="text-right">
                  {done ? (
                    <p className="text-xl font-bold tracking-tight" style={{ color: "var(--green)" }}>Completed!</p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                        {dailyGoal.current}<span className="text-base font-normal" style={{ color: "var(--text-3)" }}>/{dailyGoal.target}</span>
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>minutes</p>
                    </>
                  )}
                </div>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${dailyGoal.percentage}%`, background: done ? "var(--green)" : "var(--accent)" }} /></div>
              {done
                ? <div className="flex items-center gap-2 mt-3 text-sm font-semibold" style={{ color: "var(--green)" }}>
                    <CheckCircle2 size={15} style={{ pointerEvents: "all" }} /> Goal achieved for today!
                  </div>
                : <button onClick={() => navigate("/practice")} className="btn-primary w-full py-2.5 text-sm mt-4">Continue Practice →</button>}
            </div>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-5">
            <Section title="Skill Levels">
              <div className="flex flex-col gap-3.5">
                {skills.length > 0
                  ? skills.map((s) => <ProgressBar key={s.label} label={s.label} value={s.value} />)
                  : ["Fluency", "Grammar", "Pronunciation", "Vocabulary"].map((l) => (
                      <ProgressBar key={l} label={l} value={0} />
                    ))}
              </div>
            </Section>

            {/* Roadmap */}
            <div className="card p-5 flex-1">
              <p className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>Learning Roadmap</p>
              {roadmap.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Complete a session to unlock your roadmap.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {roadmap.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{ borderColor: item.done || item.is_completed ? "var(--accent)" : "var(--border)", background: (item.done || item.is_completed) ? "rgba(129,140,248,0.15)" : "transparent" }}>
                        {(item.done || item.is_completed) && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
                      </div>
                      <p className="text-xs" style={{ color: (item.done || item.is_completed) ? "var(--text-3)" : "var(--text-2)", textDecoration: (item.done || item.is_completed) ? "line-through" : "none" }}>
                        {item.label ?? item.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => navigate("/session")} className="btn-primary w-full py-2.5 text-xs mt-5">
                Start Practice →
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
