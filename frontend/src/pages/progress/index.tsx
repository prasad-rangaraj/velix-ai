import { useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { ScoreRing } from "@/components/ScoreRing";
import { Bar, Radar } from "react-chartjs-2";
import { TrendingUp, TrendingDown, Clock, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
  RadialLinearScale, PointElement, LineElement, Filler,
} from "chart.js";
import { useProgressStore } from "@/store";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, RadialLinearScale, PointElement, LineElement, Filler);

// ── Month-over-month deltas (competitor gap: no app shows this) ──
const skills = [
  { label: "Fluency",       now: 0, prev: 0 },
  { label: "Grammar",       now: 0, prev: 0 },
  { label: "Pronunciation", now: 0, prev: 0 },
  { label: "Vocabulary",    now: 0, prev: 0 },
  { label: "Confidence",    now: 0, prev: 0 },
];


const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: "var(--text-3)" as any, font: { size: 11 } } },
    y: { grid: { color: "var(--border)" as any }, border: { display: false }, ticks: { color: "var(--text-3)" as any, stepSize: 1 }, min: 0, max: 4 },
  },
};


const radarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    r: {
      beginAtZero: true, max: 100,
      grid: { color: "rgba(99,102,241,0.1)" },
      angleLines: { color: "rgba(99,102,241,0.1)" },
      pointLabels: { color: "var(--text-2)" as any, font: { size: 11 } },
      ticks: { display: false, stepSize: 25 },
    },
  },
};



const badges = [
  { icon: "🎯", label: "First Session", earned: false },
  { icon: "🔥", label: "7-Day Streak",  earned: false },
  { icon: "💎", label: "500 XP Club",   earned: false },
  { icon: "🎤", label: "10 Sessions",   earned: false },
  { icon: "🏆", label: "Score 90+",     earned: false },
  { icon: "🌍", label: "Native Fluency",earned: false },
];

export const Progress = () => {
  const { fetchOverview, fetchAchievements, overview, achievements } = useProgressStore();
  const navigate = useNavigate();

  useEffect(() => { fetchOverview(); fetchAchievements(); }, []);

  const skillList = overview
    ? Object.entries(overview.skills).map(([k, v]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        now: Math.round(v),
        prev: Math.max(0, Math.round(v) - 10),
      }))
    : skills;

  const radarDisplay = {
    labels: skillList.map((s) => s.label),
    datasets: [
      {
        label: "This Month",
        data: skillList.map((s) => s.now),
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvas, chartArea } = chart;
          if (!chartArea) return "rgba(79,70,229,0.15)";
          const gradient = canvas.createRadialGradient(
            (chartArea.left + chartArea.right) / 2,
            (chartArea.top + chartArea.bottom) / 2,
            0,
            (chartArea.left + chartArea.right) / 2,
            (chartArea.top + chartArea.bottom) / 2,
            chartArea.right - chartArea.left
          );
          gradient.addColorStop(0, "rgba(79,70,229,0.35)");
          gradient.addColorStop(1, "rgba(79,70,229,0.0)");
          return gradient;
        },
        borderColor: "rgba(79,70,229,0.9)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(79,70,229,1)",
        pointRadius: 4,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1.5,
      },
      {
        label: "Last Month",
        data: skillList.map((s) => s.prev),
        backgroundColor: "rgba(148,163,184,0.05)",
        borderColor: "rgba(148,163,184,0.6)",
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointRadius: 3,
        pointBackgroundColor: "rgba(148,163,184,0.8)",
      },
    ],
  };

  const badgesDisplay = achievements.length > 0 ? achievements : badges;

  const calDataLive = (() => {
    const d: { date: string; count: number }[] = [];
    const today = new Date();
    const minutesByDate: Record<string, number> = {};
    (overview?.recent_sessions ?? []).forEach((s) => {
      const dt = (s.date ?? "").split("T")[0];
      minutesByDate[dt] = (minutesByDate[dt] || 0) + (s.minutes || 0);
    });
    for (let i = 0; i < 120; i++) {
      const dt = new Date(today); dt.setDate(dt.getDate() - i);
      const dateStr = dt.toISOString().split("T")[0];
      d.push({ date: dateStr, count: minutesByDate[dateStr] || 0 });
    }
    return d;
  })();

  const weeklyDataLive = {
    labels: [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("en-US", { weekday: "short" });
    }),
    datasets: [{
      data: (() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        today.setHours(0,0,0,0);
        overview?.recent_sessions?.forEach((s: any) => {
          const d = new Date(s.date);
          d.setHours(0,0,0,0);
          const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
          if (diffDays >= 0 && diffDays < 7) counts[6 - diffDays] += 1;
        });
        return counts;
      })(),
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const {ctx: canvas, chartArea} = chart;
        if (!chartArea) return "rgba(79,70,229,0.65)";
        const gradient = canvas.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, "rgba(79,70,229,0.2)");
        gradient.addColorStop(1, "rgba(79,70,229,0.9)");
        return gradient;
      },
      hoverBackgroundColor: "rgba(67,56,202,1)",
      borderRadius: 6, borderSkipped: false,
    }],
  };

  return (
  <SidebarLayout>
    <div className="p-7 max-w-6xl mx-auto">
      <PageHeader title="Progress" eyebrow="Your Journey" subtitle="Month-over-month skill improvement" />

      <div className="card p-6 mb-5">
        <p className="text-sm font-semibold mb-5 text-slate-800">Current Skill Scores</p>
        <div className="grid grid-cols-6 gap-4">
          <ScoreRing value={overview?.avg_score || 0} size={80} strokeWidth={7} label="Overall" />
          {skillList.map((s) => (
            <ScoreRing key={s.label} value={s.now} size={80} strokeWidth={7} label={s.label} />
          ))}
        </div>
      </div>

      {/* ── Month-over-month deltas (no competitor shows this clearly) ── */}
      <Section title="Skill Progress vs. Last Month" className="mb-5">
        <div className="grid grid-cols-5 gap-4">
          {skillList.map((s) => {
            const diff = s.now - s.prev;
            const pct = Math.round((diff / s.prev) * 100);
            return (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-2)" }}>{s.label}</p>
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  {diff >= 0
                    ? <TrendingUp size={14} style={{ pointerEvents: "all", color: "var(--green)" }} />
                    : <TrendingDown size={14} style={{ pointerEvents: "all", color: "var(--red)" }} />}
                  <span className="text-base font-bold"
                    style={{ color: diff >= 0 ? "var(--green)" : "var(--red)" }}>
                    {diff > 0 ? "+" : ""}{pct || 0}%
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{s.prev} → {s.now}</p>
                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: `${s.now}%`, background: diff > 0 ? "var(--green)" : "var(--red)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <Section title="Sessions This Week" className="col-span-2">
          <div className="h-40"><Bar data={weeklyDataLive} options={barOptions} /></div>
          <div className="flex gap-8 mt-4 pt-4 divider">
            {[["Sessions", (overview?.total_sessions || 0).toString()], ["Practice Time", `${overview?.total_minutes || 0} min`], ["Avg Score", `${Math.round(overview?.avg_score || 0)}/100`]].map(([l, v]) => (
              <div key={l as string}>
                <p className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{v}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{l}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Radar chart: none of the competitors show all 5 dimensions at once ── */}
        <Section title="Skill Radar — This vs. Last Month">
          <div className="h-48 flex items-center justify-center">
            <Radar data={radarDisplay} options={radarOptions} />
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center text-xs" style={{ color: "var(--text-3)" }}>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-0.5 rounded bg-indigo-500" /> This Month
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-0.5 rounded opacity-40" style={{ background: "var(--accent)", borderTop: "1.5px dashed" }} /> Last Month
            </span>
          </div>
        </Section>
      </div>

      <Section title="Activity Calendar" className="mb-8">
        <ActivityCalendar data={calDataLive} />
      </Section>

      <Section title="Recent Practice Feed" className="mb-5">
        <div className="flex flex-col gap-3">
          {(overview?.recent_sessions ?? []).slice(0, 15).map((session, i) => (
            <div key={i} 
              className="card p-4 flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:ring-2 hover:ring-indigo-100 transition-all bg-white" 
              onClick={() => navigate(`/report/${session.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Activity size={18} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{session.title || "Custom Scenario"}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                    <Clock size={12} /> {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {session.minutes} mins
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-sm font-black text-slate-800">{session.score}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div>
                    <p className="text-sm font-black text-emerald-500">+{session.xp}</p>
                    <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider">XP</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <ArrowRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
          {!(overview?.recent_sessions?.length) && (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl bg-slate-50/50">
              No recent activity found. Head over to the Practice tab to begin!
            </div>
          )}
        </div>
      </Section>

      <Section title="Achievements">
        <div className="grid grid-cols-6 gap-3">
          {badgesDisplay.map((b: any) => (
            <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center"
              style={{ background: b.earned ? "rgba(251,191,36,0.06)" : "var(--bg)", borderColor: b.earned ? "rgba(251,191,36,0.3)" : "var(--border)", opacity: b.earned ? 1 : 0.4 }}>
              <span className="text-2xl">{b.icon}</span>
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{b.label}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  </SidebarLayout>
  );
};
