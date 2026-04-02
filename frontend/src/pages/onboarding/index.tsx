import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { anonymousLogin } from "@/store/api/auth";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Headphones, Check, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  { id: "age", title: "How old are you?", sub: "We adjust pacing and tone to suit your age group.", options: ["Under 18", "18–24", "25–34", "35–44", "45+"] },
  { id: "gender", title: "How do you identify?", sub: "Helps us personalise the AI voice and conversation style.", options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
  { id: "skill", title: "Your current English level?", sub: "Be honest — we'll calibrate from here.", options: ["Beginner (A1–A2)", "Elementary (A2–B1)", "Intermediate (B1)", "Upper Intermediate (B2)", "Advanced (C1–C2)"] },
  { id: "goal", title: "What's your main goal?", sub: "We'll build your roadmap around this.", options: ["Ace job interviews", "Communicate better at work", "Travel & daily conversations", "Academic or exam preparation", "General fluency improvement"] },
];

export const Onboarding = () => {
  const { page } = useParams();
  const navigate = useNavigate();
  const { setField, ageGroup, gender, setOnboardingToken } = useOnboardingStore();
  const { setToken } = useAuthStore();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === page));
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (!selected) return;
    const fieldMap: Record<string, string> = { age: "ageGroup", gender: "gender", skill: "profession", goal: "" };
    const field = fieldMap[step.id];
    if (field) setField(field, selected);
    if (!isLast) { navigate(`/onboarding/${STEPS[stepIndex + 1].id}`); setSelected(""); return; }
    setLoading(true);
    try {
      await anonymousLogin({ age_group: ageGroup, gender });
      navigate("/register");
    } catch { navigate("/register"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      {/* Left sidebar — step tracker */}
      <div className="hidden lg:flex w-72 shrink-0 bg-white border-r border-slate-200 flex-col p-8 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 shadow-md flex items-center justify-center">
            <Headphones size={14} className="text-white" style={{ pointerEvents: "all" }} />
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-sm">VelixAI</span>
        </div>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5 px-1">Setup Steps</p>
        <div className="flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300",
              i === stepIndex ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm border border-emerald-100/50" :
                i < stepIndex ? "text-slate-400" : "text-slate-400"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                i < stepIndex ? "bg-emerald-500 border-emerald-500" :
                  i === stepIndex ? "border-emerald-500" : "border-slate-200"
              )}>
                {i < stepIndex
                  ? <Check size={10} className="text-white" style={{ pointerEvents: "all" }} />
                  : i === stepIndex ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    : null}
              </div>
              <span className="text-xs leading-snug">{s.title.slice(0, 28)}{s.title.length > 28 ? "…" : ""}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f0f2f5]">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-9">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-400 font-bold tracking-wide shrink-0">{stepIndex + 1}/{STEPS.length}</span>
          </div>

          <h2 className="text-[26px] font-bold text-slate-800 tracking-tight mb-2">{step.title}</h2>
          <p className="text-sm text-slate-500 mb-8">{step.sub}</p>

          <div className="flex flex-col gap-3">
            {step.options.map((opt) => (
              <button key={opt} onClick={() => setSelected(opt)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-semibold flex items-center gap-4 transition-all duration-300 outline-none",
                  selected === opt
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.3)] scale-[1.02] -translate-y-0.5"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-slate-50 hover:shadow-sm"
                )}>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  selected === opt ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                )}>
                  {selected === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => { stepIndex > 0 ? navigate(`/onboarding/${STEPS[stepIndex - 1].id}`) : navigate("/login"); setSelected(""); }}
              className="btn-secondary px-4 py-2.5 text-sm">
              <ArrowLeft size={14} style={{ pointerEvents: "all" }} /> Back
            </button>
            <button onClick={handleNext} disabled={!selected || loading}
              className="btn-primary flex-1 py-2.5 text-sm">
              {loading ? "Setting up…" : isLast ? "Get Started" : "Continue"}
              {!loading && <ArrowRight size={14} style={{ pointerEvents: "all" }} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
