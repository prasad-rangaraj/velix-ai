import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Mic, FlaskConical, User, LogOut,
  BookOpen, TrendingUp, BookMarked, Users, LineChart,
  BookText, Globe, Briefcase, Swords, Heart, ChevronRight,
} from "lucide-react";

const navGroups = [
  {
    label: "Learn",
    items: [
      { to: "/",          icon: LayoutDashboard, label: "Dashboard" },
      { to: "/learn",     icon: BookOpen,        label: "Learning Path" },
      { to: "/progress",  icon: TrendingUp,      label: "Progress" },
    ],
  },
  {
    label: "Practice",
    items: [
      { to: "/practice",   icon: Mic,        label: "Practice" },
      { to: "/vocabulary", icon: BookMarked,  label: "Vocabulary" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/patterns", icon: LineChart, label: "Talk Patterns" },
      { to: "/journal",  icon: BookText,  label: "Voice Journal" },
      { to: "/anxiety",  icon: Heart,     label: "Anxiety Coach" },
    ],
  },
  {
    label: "Career",
    items: [
      { to: "/interview-room", icon: Briefcase, label: "Interview Room" },
      { to: "/debate",         icon: Swords,    label: "Debate Arena" },
    ],
  },
  {
    label: "Global",
    items: [
      { to: "/culture",    icon: Globe,  label: "Culture Room" },
    ],
  },
];

export const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col h-full" style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
      }}>

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-3">
          <div className="relative">
            <img
              src="/logo.png"
              alt="VelixAI"
              className="w-9 h-9 rounded-2xl object-cover shrink-0"
              style={{ boxShadow: "0 0 0 2px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.25)" }}
            />
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-400"
              style={{ borderColor: "var(--sidebar)" }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-none tracking-tight truncate" style={{ color: "var(--text)" }}>VelixAI</p>
            <p className="text-[10px] mt-0.5 font-medium tracking-wide uppercase" style={{ color: "var(--accent)" }}>AI Coach</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-3 h-px" style={{ background: "var(--border)" }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-3)" }}>
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) => cn(
                      "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150",
                      isActive
                        ? "text-white"
                        : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                    )}
                    style={({ isActive }) => isActive ? {
                      background: "linear-gradient(135deg, #6366F1, #818CF8)",
                      boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
                    } : {}}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={14}
                          style={{ pointerEvents: "all", flexShrink: 0, opacity: isActive ? 1 : 0.7 }}
                        />
                        <span className="truncate">{label}</span>
                        {isActive && (
                          <ChevronRight
                            size={11}
                            className="ml-auto opacity-70"
                            style={{ pointerEvents: "all" }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 pt-2 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 mb-0.5",
              isActive
                ? "text-white"
                : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
            )}
            style={({ isActive }) => isActive ? {
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
            } : {}}
          >
            {({ isActive }) => (
              <>
                <User size={14} style={{ pointerEvents: "all", flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span>Profile</span>
                {isActive && <ChevronRight size={11} className="ml-auto opacity-70" style={{ pointerEvents: "all" }} />}
              </>
            )}
          </NavLink>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 hover:bg-red-500/10"
            style={{ color: "var(--red)" }}
          >
            <LogOut size={14} style={{ pointerEvents: "all", flexShrink: 0, opacity: 0.8 }} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

/* ── Shared layout components ── */

export const PageHeader = ({ title, subtitle, action, eyebrow }: {
  title: string; subtitle?: string; action?: React.ReactNode; eyebrow?: string;
}) => (
  <div className="flex items-start justify-between mb-7">
    <div>
      {eyebrow && <p className="label mb-1.5">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{title}</h1>
      {subtitle && <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const MetricCard = ({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean;
}) => (
  <div className="card p-5"
    style={accent ? { borderColor: "rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)" } : {}}>
    <div className="flex items-center justify-between mb-3">
      <p className="label">{label}</p>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: accent ? "rgba(99,102,241,0.12)" : "var(--bg)" }}>
        <Icon size={14} style={{ pointerEvents: "all", color: accent ? "var(--accent)" : "var(--text-3)" }} />
      </div>
    </div>
    <p className="text-[26px] font-bold tracking-tight" style={{ color: accent ? "var(--accent)" : "var(--text)" }}>{value}</p>
    {sub && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{sub}</p>}
  </div>
);

export const ProgressBar = ({ value, label, className }: {
  value: number; label?: string; className?: string;
}) => (
  <div className={className}>
    {label && (
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: "var(--text)" }}>{value}%</span>
      </div>
    )}
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

export const Section = ({ title, children, action, className }: {
  title?: string; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) => (
  <div className={`card p-5 ${className ?? ""}`}>
    {title && (
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</p>
        {action}
      </div>
    )}
    {children}
  </div>
);
