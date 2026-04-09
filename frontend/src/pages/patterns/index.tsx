import { useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { Bar, Line } from "react-chartjs-2";
import { Loader2 } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Tooltip, LineElement, PointElement, Filler,
} from "chart.js";
import { usePatternsStore } from "@/store/patterns";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, LineElement, PointElement, Filler);

const sevStyle = {
  warning: { bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)", dot: "#D97706" },
  error:   { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)",  dot: "#DC2626" },
  success: { bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.25)", dot: "#059669" },
  high:    { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)",  dot: "#DC2626" },
  medium:  { bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)", dot: "#D97706" },
  low:     { bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.25)", dot: "#059669" },
};

const chartOpts = (max?: number) => ({
  responsive: true, 
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
    }
  },
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  scales: {
    x: { 
      grid: { display: false }, 
      border: { display: false }, 
      ticks: { color: "var(--text-3)" as any, font: { family: "Plus Jakarta Sans", size: 11, weight: "500" } } 
    },
    y: { 
      grid: { color: "var(--border)" as any, strokeDash: [4, 4] }, 
      border: { display: false }, 
      beginAtZero: true,
      ticks: { 
        color: "var(--text-3)" as any, 
        font: { family: "Plus Jakarta Sans", size: 11 },
        padding: 10,
        ... (max ? { max, stepSize: max / 4 } : {}) 
      },
    },
  },
});

export const Patterns = () => {
  const { patterns, isLoading, error, fetchPatterns } = usePatternsStore();

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full text-[var(--text-3)] text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading communication patterns...
        </div>
      </SidebarLayout>
    );
  }

  if (error || !patterns) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 text-xl">⚠️</div>
          <h3 className="text-lg font-bold mb-2">Failed to Load Patterns</h3>
          <p className="text-[var(--text-3)] text-sm max-w-sm mb-6">
            {error || "We couldn't retrieve your communication data. This might happen if you haven't completed any sessions yet."}
          </p>
          <button 
            onClick={() => fetchPatterns()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Try Again
          </button>
        </div>
      </SidebarLayout>
    );
  }

  // Dynamic Chart Building
  const fillerByTopic = {
    labels: Object.keys(patterns.filler_by_topic || {}),
    datasets: [{
      label: "Fillers/100w",
      data: Object.values(patterns.filler_by_topic || {}),
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const {ctx: canvas, chartArea} = chart;
        if (!chartArea) return "rgba(99,102,241,0.6)";
        const v = ctx.raw as number;
        const gradient = canvas.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        if (v > 4.0) {
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 1)");
        } else if (v > 2.5) {
          gradient.addColorStop(0, "rgba(245, 158, 11, 0.4)");
          gradient.addColorStop(1, "rgba(245, 158, 11, 1)");
        } else {
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.6)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0.9)");
        }
        return gradient;
      },
      borderRadius: 6, 
      borderSkipped: false,
      barThickness: 24,
    }],
  };

  // Specific options for the horizontal bar chart
  const horizontalBarOpts = {
    ...chartOpts(10), // Give it some max x-range headroom
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: { color: "var(--border)" as any, strokeDash: [4, 4] },
        border: { display: false },
        ticks: { color: "var(--text-3)" as any, font: { family: "Plus Jakarta Sans", size: 11 }, padding: 10, max: 10, stepSize: 2 }
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "var(--text-3)" as any, font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }, padding: 8 }
      }
    }
  };

  const hesitationData = {
    labels: Object.keys(patterns.hesitation_by_type || {}),
    datasets: [{
      label: "Pause (s)",
      data: Object.values(patterns.hesitation_by_type || {}),
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const {ctx: canvas, chartArea} = chart;
        if (!chartArea) return "rgba(99,102,241,0.6)";
        const v = ctx.raw as number;
        const gradient = canvas.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        if (v > 4.5) {
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 1)");
        } else if (v > 3.0) {
          gradient.addColorStop(0, "rgba(245, 158, 11, 0.4)");
          gradient.addColorStop(1, "rgba(245, 158, 11, 1)");
        } else {
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.4)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 1)");
        }
        return gradient;
      },
      borderRadius: 6, 
      borderSkipped: false,
      barThickness: 24,
    }],
  };

  const weeklyData = patterns.assertiveness_weekly || [];
  const assertivenessData = {
    labels: weeklyData.map((_: any, i: number) => `W${i + 1}`),
    datasets: [{
      label: "Assertiveness",
      data: weeklyData,
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart;
        const {ctx: canvas, chartArea} = chart;
        if (!chartArea) return "rgba(16, 185, 129, 0.12)";
        const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
        gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
        return gradient;
      },
      borderColor: "rgba(16, 185, 129, 1)",
      borderWidth: 3, 
      fill: true, 
      tension: 0.5,
      pointBackgroundColor: "rgba(255, 255, 255, 1)",
      pointBorderColor: "rgba(16, 185, 129, 1)",
      pointBorderWidth: 2, 
      pointRadius: 4,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: "rgba(16, 185, 129, 1)",
    }],
  };

  return (
    <SidebarLayout>
      <div className="p-7 max-w-6xl mx-auto">
      <PageHeader
        title="Talk Patterns"
        eyebrow="Communication DNA"
        subtitle="Systemic patterns across all your sessions — not visible in any single report"
      />

      {/* AI insight strip */}
      <div className="rounded-2xl p-4 mb-6 flex items-center gap-4"
        style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.25)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
          style={{ background: "rgba(99,102,241,0.15)" }}>🧠</div>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Your Communication DNA</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
            Analysed across <strong style={{ color: "var(--accent)" }}>{patterns.sessions_analysed} sessions</strong> · Your biggest opportunity: <strong style={{ color: "var(--accent)" }}>reduce hesitation during high-stakes topics</strong>
          </p>
        </div>
      </div>

      {/* Insights cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {(patterns.top_insights || []).map((ins: any, idx: number) => {
          const st = sevStyle[ins.severity as keyof typeof sevStyle] || sevStyle.low;
          const [findingStr, actionStr] = ins.text.split("Fix:").map((s: string) => s.trim());
          
          return (
            <div key={idx} className="rounded-2xl p-4 border"
              style={{ background: st.bg, borderColor: st.border }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>{ins.type} finding</p>
              </div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>{findingStr || ins.text}</p>
              {actionStr && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                  <span className="font-semibold" style={{ color: st.dot }}>Fix: </span>{actionStr}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Filler word heatmap */}
        <Section title="Filler Words by Topic" className="col-span-1">
          <div className="h-[220px]">
            <Bar data={fillerByTopic} options={horizontalBarOpts as any} />
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--text-3)" }}>
            Fillers measured per 100 words spoken
          </p>
        </Section>

        {/* Hesitation map */}
        <Section title="Hesitation by Question Type">
          <div className="h-[220px]">
            <Bar data={hesitationData} options={horizontalBarOpts as any} />
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--text-3)" }}>Average pause duration in seconds</p>
        </Section>

        {/* Assertiveness trend */}
        <Section title={`Assertiveness Trend — ${weeklyData.length} ${weeklyData.length === 1 ? 'Week' : 'Weeks'}`}>
          <div className="h-[220px]">
            <Line data={assertivenessData} options={chartOpts(100) as any} />
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--green)" }}>
            {weeklyData.length === 1 ? "Baseline established. Keep practicing!" : "Trend is tracking upward!"}
          </p>
        </Section>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Avg Filler Rate",       value: `${patterns.overall_filler_rate} / 100w`,   trend: "Tracking",               color: "var(--text-3)" },
          { label: "Avg Pause",             value: `${patterns.hesitation_by_type?.["Behavioural"] || 2.1}s`, trend: "Tracking", color: "var(--text-3)" },
          { label: "Sentence Completion",    value: `${patterns.sentence_completion_rate}%`,   trend: "Tracking",               color: "var(--text-3)" },
          { label: "Upspeak Instances",      value: `${patterns.upspeak_count_avg} / sess`,    trend: "Tracking",               color: "var(--text-3)" },
          { label: "Assertiveness Score",    value: `${patterns.overall_assertiveness} / 100`, trend: "Baseline",               color: "var(--text-3)" },
        ].map((m) => (
          <div key={m.label} className="card p-4 text-center">
            <p className="text-xl font-bold tracking-tight mb-1" style={{ color: "var(--text)" }}>{m.value}</p>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-3)" }}>{m.label}</p>
            <p className="text-[11px] font-semibold" style={{ color: m.color }}>{m.trend}</p>
          </div>
        ))}
      </div>
    </div>
  </SidebarLayout>
  );
};
