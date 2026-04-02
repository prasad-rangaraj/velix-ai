import { useEffect, useMemo } from "react";
import { SidebarLayout, PageHeader } from "@/layouts/SidebarLayout";
import { useNavigate } from "react-router-dom";
import { useHomeStore } from "@/store/home";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Circle, ChevronRight, Star, Clock } from "lucide-react";

interface Module {
  id: string;
  title: string;
  unit: string;
  description: string;
  xp: number;
  duration: string;
  status: "completed" | "current" | "locked";
  lessons: number;
}

const MODULE_METADATA: Omit<Module, "status" | "id">[] = [
  { title: "Introductions & Small Talk", unit: "Unit 1", description: "Greet confidently, introduce yourself and make natural small talk.", xp: 150, duration: "45 min", lessons: 5 },
  { title: "Describing Your Work", unit: "Unit 1", description: "Explain your job role, industry, and responsibilities clearly.", xp: 150, duration: "40 min", lessons: 4 },
  { title: "Job Interview Basics", unit: "Unit 2", description: "Answer common interview questions with structure and confidence.", xp: 200, duration: "60 min", lessons: 6 },
  { title: "Email & Professional Writing", unit: "Unit 2", description: "Adapt written skills to speak about emails and documents.", xp: 150, duration: "35 min", lessons: 4 },
  { title: "Meeting Facilitation", unit: "Unit 3", description: "Lead meetings, manage discussions and summarise outcomes.", xp: 200, duration: "55 min", lessons: 5 },
  { title: "Salary Negotiation", unit: "Unit 3", description: "Advocate for your worth with confident, professional language.", xp: 250, duration: "50 min", lessons: 5 },
  { title: "Client Presentations", unit: "Unit 4", description: "Structure and deliver compelling presentations to any audience.", xp: 250, duration: "65 min", lessons: 6 },
  { title: "Dealing with Conflict", unit: "Unit 4", description: "Navigate difficult conversations and disagreements professionally.", xp: 200, duration: "50 min", lessons: 5 },
  { title: "Advanced Fluency & Idioms", unit: "Unit 5", description: "Sound more natural with idiomatic English and connected speech.", xp: 300, duration: "70 min", lessons: 7 },
  { title: "Executive Communication", unit: "Unit 5", description: "Communicate with authority and executive presence.", xp: 350, duration: "75 min", lessons: 8 },
];

const units = [...new Set(MODULE_METADATA.map((m) => m.unit))];

export const Learn = () => {
  const navigate = useNavigate();
  const { roadmap, fetchDashboard } = useHomeStore();

  useEffect(() => {
    // Only fetch if roadmap is empty
    if (roadmap.length === 0) {
      fetchDashboard();
    }
  }, [roadmap.length, fetchDashboard]);

  // Combine backend roadmap with frontend metadata
  const modules = useMemo<Module[]>(() => {
    let uncompletedFound = false;

    return MODULE_METADATA.map((meta, index) => {
      // Find matching roadmap item from backend
      const roadmapItem = roadmap.find(r => r.title === meta.title);
      const isDone = roadmapItem ? (roadmapItem.done || roadmapItem.is_completed) : false;

      let status: "completed" | "current" | "locked" = "locked";

      if (isDone) {
        status = "completed";
      } else if (!uncompletedFound) {
        status = "current";
        uncompletedFound = true;
      }

      return {
        ...meta,
        id: `m${index + 1}`,
        status,
      };
    });
  }, [roadmap]);

  const completed = modules.filter((m) => m.status === "completed").length;

  return (
    <SidebarLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <PageHeader
          title="Learning Path"
          subtitle="Your personalised course from Intermediate B1 to Advanced C1"
          action={
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-700">{completed}/{modules.length}</p>
              <p className="text-xs text-[var(--text-3)]">modules complete</p>
            </div>
          }
        />

        {/* Overall progress */}
        <div className="card p-5 mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Overall course progress</p>
            <span className="text-sm font-bold text-emerald-700">{Math.round((completed / Math.max(modules.length, 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(completed / Math.max(modules.length, 1)) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-3)]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />Completed</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-200 ring-2 ring-emerald-400" />Current</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200" />Locked</span>
          </div>
        </div>

        {/* Units */}
        <div className="flex flex-col gap-8">
          {units.map((unit) => {
            const unitModules = modules.filter((m) => m.unit === unit);
            return (
              <div key={unit}>
                <p className="label mb-3">{unit}</p>
                <div className="flex flex-col gap-3 relative">
                  {/* Connector line */}
                  <div className="absolute left-5 top-10 bottom-10 w-px bg-slate-200 z-0" />

                  {unitModules.map((mod) => {
                    const Icon = mod.status === "completed" ? CheckCircle2
                      : mod.status === "current" ? Circle
                      : Lock;

                    return (
                      <div key={mod.id}
                        className={cn(
                          "card flex items-start gap-4 p-4 z-10 transition-all",
                          mod.status === "locked" && "opacity-60",
                          mod.status !== "locked" && "card-hover cursor-pointer",
                        )}
                        onClick={() => mod.status !== "locked" && navigate("/session", { state: { scenarioId: "custom", customPrompt: `Focus on: ${mod.title}. ${mod.description}` } })}
                      >
                        {/* Status icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                          mod.status === "completed" ? "bg-emerald-50 border-emerald-400" :
                          mod.status === "current" ? "bg-[var(--surface)] border-emerald-500 ring-2 ring-emerald-200" :
                          "bg-slate-100 border-slate-200"
                        )}>
                          <Icon size={18}
                            className={mod.status === "completed" ? "text-emerald-600" : mod.status === "current" ? "text-emerald-500" : "text-[var(--text-3)]"}
                            style={{ pointerEvents: "all" }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={cn("font-semibold text-sm", mod.status === "locked" ? "text-[var(--text-3)]" : "text-[var(--text)]")}>
                                {mod.title}
                              </p>
                              <p className="text-xs text-[var(--text-3)] mt-0.5">{mod.description}</p>
                            </div>
                            {mod.status !== "locked" && (
                              <ChevronRight size={16} className="text-slate-300 shrink-0 mt-0.5" style={{ pointerEvents: "all" }} />
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                              <Clock size={11} style={{ pointerEvents: "all" }} /> {mod.duration}
                            </span>
                            <span className="text-xs text-[var(--text-3)]">{mod.lessons} lessons</span>
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Star size={11} style={{ pointerEvents: "all" }} /> {mod.xp} XP
                            </span>
                            {mod.status === "current" && (
                              <span className="badge bg-emerald-100 text-emerald-700">In Progress</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SidebarLayout>
  );
};
