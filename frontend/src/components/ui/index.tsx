/**
 * Shared UI primitives — import from "@/components/ui"
 */

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ── Badge ── */
export const Badge = ({
  children, variant = "default", className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "accent" | "outline";
  className?: string;
}) => {
  const styles: Record<string, React.CSSProperties> = {
    default:  { background: "var(--bg)", color: "var(--text-2)", border: "1px solid var(--border)" },
    success:  { background: "rgba(5,150,105,0.10)", color: "var(--green)", border: "1px solid rgba(5,150,105,0.25)" },
    warning:  { background: "rgba(217,119,6,0.10)", color: "var(--amber)", border: "1px solid rgba(217,119,6,0.25)" },
    error:    { background: "rgba(220,38,38,0.10)", color: "var(--red)", border: "1px solid rgba(220,38,38,0.25)" },
    accent:   { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)" },
    outline:  { background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)" },
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", className)}
      style={styles[variant]}>
      {children}
    </span>
  );
};

/* ── DeltaBadge — shows improvement vs. previous value ── */
export const DeltaBadge = ({ now, prev, suffix = " pts" }: { now: number; prev: number; suffix?: string }) => {
  const diff = now - prev;
  if (diff === 0)
    return <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-3)" }}><Minus size={10} style={{ pointerEvents: "all" }} /> Same</span>;
  return (
    <span className="text-xs font-semibold flex items-center gap-0.5"
      style={{ color: diff > 0 ? "var(--green)" : "var(--red)" }}>
      {diff > 0
        ? <TrendingUp size={11} style={{ pointerEvents: "all" }} />
        : <TrendingDown size={11} style={{ pointerEvents: "all" }} />}
      {diff > 0 ? "+" : ""}{diff}{suffix}
    </span>
  );
};

/* ── EmptyState ── */
export const EmptyState = ({
  icon: Icon, title, body,
}: {
  icon: React.ElementType; title: string; body?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <Icon size={20} style={{ pointerEvents: "all", color: "var(--text-3)" }} />
    </div>
    <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{title}</p>
    {body && <p className="text-xs max-w-xs" style={{ color: "var(--text-3)" }}>{body}</p>}
  </div>
);

/* ── StatCard — small stat tile ── */
export const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
    <p className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{value}</p>
    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
  </div>
);

/* ── ToggleSwitch ── */
export const ToggleSwitch = ({
  enabled, onChange,
}: {
  enabled: boolean; onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!enabled)}
    style={{ height: "1.375rem", width: "2.5rem", borderRadius: "99px", position: "relative", transition: "background 0.2s", background: enabled ? "var(--accent-dk)" : "var(--border)", flexShrink: 0, cursor: "pointer", border: "none" }}
  >
    <div style={{
      position: "absolute", top: "3px", width: "1rem", height: "1rem",
      background: "var(--surface)", borderRadius: "99px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      transition: "left 0.2s",
      left: enabled ? "calc(100% - 1.125rem)" : "3px",
    }} />
  </button>
);
