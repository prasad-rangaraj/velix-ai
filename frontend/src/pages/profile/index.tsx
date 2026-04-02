import { SidebarLayout, PageHeader, Section } from "@/layouts/SidebarLayout";
import { ProgressBar } from "@/layouts/SidebarLayout";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge, StatCard, ToggleSwitch } from "@/components/ui";
import { useAuthStore } from "@/store/auth";
import { useProfileStore } from "@/store/accounts";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User, Target, Bell, LogOut, Shield, Snowflake, Loader2, X, CheckCircle } from "lucide-react";
import { api } from "@/utils";

type Tab = "overview" | "goals" | "notifications";

export const Profile = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const { profile, stats, updateProfile, useStreakFreeze, fetchProfile, fetchStats } = useProfileStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState<{ loading: boolean; error: string; success: boolean }>({ loading: false, error: "", success: false });
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  
  // Ensure profile is hydrated if visiting directly
  useEffect(() => {
    if (!profile) fetchProfile();
    if (!stats) fetchStats();
  }, [profile, stats, fetchProfile, fetchStats]);

  const triggerSavedFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  if (!profile || !stats) {
     return (
        <SidebarLayout>
           <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
           </div>
        </SidebarLayout>
     );
  }

  const STATS = [
    { label: "Sessions",  value: stats.total_sessions.toString() },
    { label: "Total XP",  value: stats.total_xp.toLocaleString() },
    { label: "Hours",     value: (stats.total_minutes / 60).toFixed(1) + "h" },
    { label: "Streak",    value: `${stats.current_streak} days` },
  ];

  const SKILLS: [string, number][] = [
    ["Fluency", Math.round(profile.skills?.fluency ?? 0)], 
    ["Grammar", Math.round(profile.skills?.grammar ?? 0)], 
    ["Pronunciation", Math.round(profile.skills?.pronunciation ?? 0)], 
    ["Vocabulary", Math.round(profile.skills?.vocabulary ?? 0)],
  ];

  const GOALS = [
    { id: "daily",   key: "daily_goal_minutes" as const, label: "Daily practice goal",      current: profile.daily_goal_minutes || 15, options: [5, 10, 15, 20, 30], unit: "min" },
    { id: "weekly",  key: "weekly_session_target" as const, label: "Weekly session target",    current: profile.weekly_session_target || 5,  options: [2, 3, 5, 7],         unit: "sessions" },
  ];

  const prefs = profile.notification_prefs || {};
  const NOTIFS = [
    { key: "daily",  label: "Daily practice reminder", desc: "Reminded to practice every day",          on: prefs.daily ?? true },
    { key: "streak", label: "Streak alerts",            desc: "Notified when your streak is at risk",    on: prefs.streak ?? true },
    { key: "new",    label: "New content",              desc: "When new modules are added",              on: prefs.new_content ?? false },
  ];

  const handleGoalChange = async (key: "daily_goal_minutes" | "weekly_session_target", val: number) => {
    await updateProfile({ [key]: val });
    triggerSavedFeedback();
  };

  const handleNotifChange = async (key: string, val: boolean) => {
    await updateProfile({ notification_prefs: { ...prefs, [key]: val } });
    triggerSavedFeedback();
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const curr = data.get("current_password") as string;
    const next = data.get("new_password") as string;
    
    setPasswordState({ loading: true, error: "", success: false });
    try {
      await api.POST("/api/user/me/password", { current_password: curr, new_password: next });
      setPasswordState({ loading: false, error: "", success: true });
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPasswordState({ loading: false, error: err.response?.data?.detail || "Invalid password", success: false });
    }
  };

  const handleFreeze = async () => {
    if (profile.streak_freeze_count > 0 && !profile.streak_frozen_today) {
       await useStreakFreeze();
    }
  };

  const freezesLeft = profile.streak_freeze_count;
  const frozen = profile.streak_frozen_today;
  const overallScore = Math.round(
      ((profile.skills?.fluency ?? 0) + (profile.skills?.grammar ?? 0) + 
       (profile.skills?.pronunciation ?? 0) + (profile.skills?.vocabulary ?? 0)) / 4
  ) || 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview",      label: "Overview" },
    { id: "goals",         label: "Goals" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <SidebarLayout>
      <div className="relative p-7 max-w-3xl mx-auto pb-24">
        {/* Saved Feedback Overlay */}
        <div className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-xl transition-all duration-300",
          showSavedFeedback ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        )} style={{ background: "var(--accent-dk)", color: "white" }}>
          <CheckCircle size={16} /> Profile settings saved
        </div>

        <PageHeader title="Profile & Settings" eyebrow="Account" />

        {/* Profile card */}
        <div className="card p-5 mb-6 flex items-center gap-5">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-inner"
            style={{ width: "3.25rem", height: "3.25rem", background: "linear-gradient(135deg, var(--accent), var(--accent-dk))", color: "white" }}>
            {profile.avatar_initials || "U"}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{profile.full_name || "User"}</p>
            <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>{profile.language_level || "Intermediate B1"} · {profile.profession || "Professional"}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">Free Plan</Badge>
              <Badge variant="accent" className="cursor-pointer hover:opacity-80 transition-opacity">Upgrade →</Badge>
            </div>
          </div>
          <ScoreRing value={overallScore} size={74} strokeWidth={6} label="Overall" color="#6366F1" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl shadow-inner" style={{ background: "var(--bg)" }}>
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
                tab === id ? "shadow-md" : "hover:bg-white/5")}
              style={{ background: tab === id ? "var(--surface)" : "transparent", color: tab === id ? "var(--text)" : "var(--text-3)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <Section title="Statistics">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATS.map((s) => <StatCard key={s.label} label={s.label} value={s.value} />)}
              </div>
            </Section>

            <Section title="Streak Protection">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Snowflake size={15} style={{ pointerEvents: "all", color: "var(--accent)" }} />
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Streak Freeze</p>
                    <Badge variant={frozen ? "accent" : freezesLeft > 0 ? "success" : "error"}>
                      {frozen ? "Active" : `${freezesLeft} left`}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                    Protect your {stats.current_streak}-day streak for one day without practicing. Earned by completing sessions.
                  </p>
                </div>
                <button
                  disabled={freezesLeft === 0 || frozen}
                  onClick={handleFreeze}
                  className={cn("shrink-0 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 border transition-all")}
                  style={{
                    background: frozen ? "var(--bg)" : freezesLeft > 0 ? "var(--accent-dim)" : "var(--bg)",
                    color: frozen ? "var(--text-3)" : "var(--accent)",
                    borderColor: frozen ? "var(--border)" : "rgba(99,102,241,0.25)",
                    cursor: freezesLeft === 0 || frozen ? "not-allowed" : "pointer",
                    opacity: freezesLeft === 0 ? 0.5 : 1,
                  }}>
                  <Snowflake size={13} style={{ pointerEvents: "all" }} />
                  {frozen ? "Frozen Today" : "Freeze Streak"}
                </button>
              </div>
              {frozen && (
                <div className="mt-3 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                  ❄️ Your streak is frozen for today. Practice tomorrow to keep it going!
                </div>
              )}
            </Section>

            <Section title="Skill Snapshot">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {SKILLS.map(([l, v]) => <ProgressBar key={l} label={l} value={v} />)}
              </div>
            </Section>

            <Section title="Account">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => { setShowPasswordModal(true); setPasswordState({ loading: false, error: "", success: false }); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
                  style={{ color: "var(--text-2)", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <Shield size={16} /> Change Password
                </button>
                <button onClick={() => { logout(); navigate("/login"); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
                  style={{ color: "var(--red)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </Section>
          </div>
        )}

        {/* Goals */}
        {tab === "goals" && (
          <div className="flex flex-col gap-5">
            {GOALS.map((g) => (
              <Section key={g.id} title={g.label}>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((opt) => (
                    <button key={opt}
                      onClick={() => handleGoalChange(g.key, opt)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                      style={{
                        background: g.current === opt ? "var(--accent-dk)" : "var(--surface)",
                        color: g.current === opt ? "white" : "var(--text-2)",
                        borderColor: g.current === opt ? "var(--accent-dk)" : "var(--border)",
                        boxShadow: g.current === opt ? "0 2px 8px var(--accent-glow)" : "none",
                      }}>
                      {opt} {g.unit}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-3 font-medium" style={{ color: "var(--text-3)" }}>
                  Currently: <strong style={{ color: "var(--text)" }}>{g.current} {g.unit}</strong>
                </p>
              </Section>
            ))}
          </div>
        )}

        {/* Notifications */}
        {tab === "notifications" && (
          <Section title="Notification Preferences">
            <div className="flex flex-col bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              {NOTIFS.map((n, i) => (
                <div key={n.key}
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: i < NOTIFS.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{n.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{n.desc}</p>
                  </div>
                  <ToggleSwitch
                    enabled={n.on}
                    onChange={(v) => handleNotifChange(n.key, v)}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl origin-bottom animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-jakarta leading-tight" style={{ color: "var(--text)" }}>Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-white/5 rounded-lg text-[var(--text-3)]"><X size={18} /></button>
            </div>
            
            {passwordState.success ? (
              <div className="py-6 text-center">
                <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
                <p className="font-semibold text-emerald-400">Password Updated</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                {passwordState.error && (
                  <p className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold">{passwordState.error}</p>
                )}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-2)" }}>Current Password</label>
                  <input required name="current_password" type="password" 
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-2)" }}>New Password</label>
                  <input required name="new_password" type="password" minLength={8}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <button type="submit" disabled={passwordState.loading}
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2"
                  style={{ background: "var(--accent)", color: "white" }}>
                  {passwordState.loading ? <Loader2 size={16} className="animate-spin" /> : "Save Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};
