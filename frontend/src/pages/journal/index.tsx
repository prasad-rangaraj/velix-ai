import { useState, useRef, useEffect } from "react";
import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { cn } from "@/lib/utils";
import { Mic, Square, Calendar, Loader2 } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler } from "chart.js";
import { useJournalStore, type JournalEntry } from "@/store/journal";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const trendOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "var(--text-2)" as any, font: { size: 11 } } } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: "var(--text-3)" as any } },
    y: { grid: { color: "var(--border)" as any }, border: { display: false }, ticks: { color: "var(--text-3)" as any }, min: 0, max: 100 },
  },
};

export const Journal = () => {
  const { entries, isLoading, isSubmitting, fetchEntries, submitEntry } = useJournalStore();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recogRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleRecord = () => {
    if (recording) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recogRef.current) recogRef.current.stop();
      setRecording(false);
      
      // Auto-submit entry out of local state
      if (transcriptRef.current.length > 5 && seconds > 2) {
        submitEntry({ transcript: transcriptRef.current, duration_seconds: seconds });
      } else {
        alert("Recording too short. Please speak more to save a journal entry.");
      }
      setSeconds(0);
    } else {
      const SpeechR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechR) {
        alert("Voice recognition is not supported in your browser, or you are not using HTTPS/localhost.");
        return;
      }

      transcriptRef.current = "";
      const rc = new SpeechR();
      rc.continuous = true;
      rc.interimResults = true;
      rc.lang = "en-US";

      rc.onresult = (e: any) => {
        let final = "";
        for (let i = 0; i < e.results.length; ++i) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
        }
        transcriptRef.current = final;
      };

      rc.start();
      recogRef.current = rc;
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds((s) => { 
          if (s >= 120) { 
            clearInterval(timerRef.current!); 
            if (recogRef.current) recogRef.current.stop();
            setRecording(false); 
            if (transcriptRef.current.length > 5) submitEntry({ transcript: transcriptRef.current, duration_seconds: 120 });
            return 0; 
          } 
          return s + 1; 
        });
      }, 1000);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = (seconds / 120) * 100;

  const trendData = {
    labels: entries.map((e) => new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })).reverse(),
    datasets: [
      { label: "Fluency",    data: entries.map((e) => e.fluency_score).reverse(),    borderColor: "rgba(99,102,241,0.8)",  fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: "rgba(99,102,241,1)",  borderWidth: 2 },
      { label: "Vocab",      data: entries.map((e) => e.vocab_score).reverse(),      borderColor: "rgba(52,211,153,0.8)",  fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: "rgba(52,211,153,1)",  borderWidth: 2 },
      { label: "Confidence", data: entries.map((e) => e.confidence_score).reverse(), borderColor: "rgba(251,191,36,0.8)",  fill: false, tension: 0.4, pointRadius: 4, pointBackgroundColor: "rgba(251,191,36,1)",  borderWidth: 2 },
    ],
  };

  if (isLoading && entries.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-full text-[var(--text-3)] text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading journal entries...
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-7 max-w-5xl mx-auto">
        <PageHeader title="Voice Journal" eyebrow="Daily Communication Fitness" subtitle="2-minute spoken reflections · AI tracks your fluency evolution" />

        {/* Recorder */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Circular recorder */}
            <div className="relative shrink-0">
              <svg width={96} height={96} className="-rotate-90">
                <circle cx={48} cy={48} r={40} fill="none" stroke="var(--border)" strokeWidth={5} />
                <circle cx={48} cy={48} r={40} fill="none"
                  stroke={recording ? "#6366F1" : "var(--border)"}
                  strokeWidth={5}
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <button onClick={toggleRecord}
                className="absolute inset-0 flex items-center justify-center rounded-full transition-all"
                style={{ color: recording ? "#6366F1" : "var(--text-3)" }}>
                {recording
                  ? <Square size={22} fill="currentColor" style={{ pointerEvents: "all" }} />
                  : <Mic size={22} style={{ pointerEvents: "all" }} />}
              </button>
            </div>

            <div className="flex-1">
              <p className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>
                {recording ? `Recording… ${fmt(seconds)} / 2:00` : "Today's Reflection"}
              </p>
              <p className="text-sm mb-3" style={{ color: "var(--text-2)" }}>
                {recording
                  ? "Speak freely. The AI is transcribing your voice in real-time."
                  : "Press record and speak for up to 2 minutes. AI will transcribe and score it automatically."}
              </p>
              {isSubmitting && <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--accent)" }}><Loader2 size={14} className="animate-spin" /> Submitting entry...</p>}
              {recording && (
                <div className="flex items-end gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-1 rounded-full animate-pulse bg-indigo-500"
                      style={{ height: `${8 + Math.random() * 20}px`, animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>5</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Day streak</p>
              <p className="text-[11px] mt-1 font-semibold" style={{ color: "var(--green)" }}>+2 fluency pts today</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-5">
          {/* 30-day trend */}
          <Section title="30-Day Communication Trend" className="col-span-2">
            <div className="h-48">
              <Line data={trendData} options={trendOpts as any} />
            </div>
          </Section>

          {/* Milestone words */}
          <Section title="This Week's New Words">
            <div className="flex flex-col gap-2">
              {["Nevertheless", "Articulate", "Concise", "Facilitate", "Proactive"].map((w, i) => (
                <div key={w} className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl" style={{ background: "var(--bg)" }}>
                  <span className="text-xs font-bold w-4 text-center" style={{ color: "var(--accent)" }}>{i + 1}</span>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{w}</p>
                  <span className="ml-auto text-[10px]" style={{ color: "var(--green)" }}>✦ New</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Entry list */}
        <div className="grid grid-cols-2 gap-4">
          <Section title="Recent Entries">
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {entries.length === 0 && !isLoading && (
                <p className="text-sm py-4 text-center" style={{ color: "var(--text-3)" }}>No journal entries yet.</p>
              )}
              {entries.map((entry) => {
                const dateSplit = new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).split(" ");
                return (
                <button key={entry.id} onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                  className={cn("flex items-center gap-3 py-3 px-3 rounded-xl text-left transition-all",
                    selected?.id === entry.id ? "bg-[var(--accent-dim)]" : "hover:bg-[var(--bg)]")}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--bg)", color: "var(--accent)" }}>
                    {dateSplit[1]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{dateSplit[0]} {dateSplit[1]}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-3)" }}>{entry.transcript.slice(0, 55)}…</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>{Math.round((entry.fluency_score + entry.vocab_score + entry.confidence_score) / 3)}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>avg</p>
                  </div>
                </button>
              )})}
            </div>
          </Section>

          {selected ? (
            <Section title={`Entry Details`}>
              <div className="flex gap-3 mb-4">
                {[["Fluency", selected.fluency_score, "#6366F1"], ["Vocab", selected.vocab_score, "#34D399"], ["Confidence", selected.confidence_score, "#FBBF24"]].map(([l, v, c]) => (
                  <div key={l as string} className="flex-1 text-center p-3 rounded-xl" style={{ background: "var(--bg)" }}>
                    <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{l}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--bg)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-3)" }}>AI TRANSCRIPT</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{selected.transcript}</p>
              </div>
            </Section>
          ) : (
            <Section title="">
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Calendar size={28} style={{ pointerEvents: "all", color: "var(--text-3)" }} />
                <p className="text-sm" style={{ color: "var(--text-2)" }}>Select an entry to view its transcript and scores</p>
              </div>
            </Section>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
