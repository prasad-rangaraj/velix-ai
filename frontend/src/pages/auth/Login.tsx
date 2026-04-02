import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emailLogin } from "@/store/api/auth";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";

const perks = [
  "Real-world AI conversation practice",
  "Detailed phoneme-level session reports",
  "Personalised roadmap from B1 to C1",
  "Interviews, meetings & daily confidence",
];

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { access_token } = await emailLogin({ email, password });
      setToken(access_token); navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Incorrect email or password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left brand panel */}
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col relative overflow-hidden p-10"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}>
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--accent)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-8"
          style={{ background: "var(--accent)", filter: "blur(60px)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <img src="/logo.png" alt="VelixAI" className="w-9 h-9 rounded-xl object-cover" style={{ boxShadow: "0 2px 10px rgba(99,102,241,0.4)" }} />
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>VelixAI</span>
        </div>

        <div className="relative z-10 mt-auto">
          <p className="label mb-3">Why people choose us</p>
          <h2 className="text-3xl font-bold tracking-tight leading-tight mb-8" style={{ color: "var(--text)" }}>
            Speak confidently<br />in any professional<br />situation.
          </h2>
          <ul className="flex flex-col gap-3.5 mb-8">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--accent-dim)", border: "1px solid rgba(129,140,248,0.3)" }}>
                  <Check size={10} style={{ pointerEvents: "all", color: "var(--accent)" }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{p}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Trusted by professionals in 40+ countries</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/logo.png" alt="VelixAI" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-bold tracking-tight" style={{ color: "var(--text)" }}>VelixAI</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--text-2)" }}>Sign in to continue your practice</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <p className="label block mb-1.5">Email</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" className="input" required />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <p className="label">Password</p>
                <button type="button" className="text-xs font-semibold"
                  style={{ color: "var(--accent)" }}>Forgot?</button>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input" required />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm border"
                style={{ background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)", color: "var(--red)" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading || !email || !password}
              className={cn("btn-primary w-full py-3 text-sm mt-1")}>
              {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight size={15} style={{ pointerEvents: "all" }} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm text-center" style={{ color: "var(--text-2)" }}>
              New here?{" "}
              <Link to="/onboarding/age" className="font-semibold" style={{ color: "var(--accent)" }}>
                Start free →
              </Link>
            </p>
            <Link to="/playground" className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2">
              Try without an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
