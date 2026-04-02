import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/utils";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, Check, Loader2,
  Mail, Lock, User, ShieldCheck,
} from "lucide-react";

const perks = [
  "AI-powered conversation practice",
  "Real-time coaching & filler detection",
  "Personalised roadmap from B1 to C1",
  "Interviews, meetings & daily confidence",
];

type Step = "details" | "otp" | "success";

export const Register = () => {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.POST("/api/auth/send-otp", { email, full_name: fullName });
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP + register ────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.POST<{ access_token: string }>("/api/auth/verify-otp", {
        email, full_name: fullName, password, otp: code,
      });
      setToken(data.access_token);
      setStep("success");
      setTimeout(() => navigate("/"), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError("");
    try { await api.POST("/api/auth/send-otp", { email, full_name: fullName }); }
    catch { setError("Failed to resend OTP."); }
    finally { setResending(false); }
  };

  // ── OTP input logic ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === "Enter" && otp.every(Boolean)) handleVerifyOTP();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) setOtp(text.split(""));
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left brand panel */}
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col relative overflow-hidden p-10"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: "var(--accent)", filter: "blur(90px)" }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-8"
          style={{ background: "var(--accent)", filter: "blur(70px)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <img src="/logo.png" alt="VelixAI" className="w-9 h-9 rounded-xl object-cover" style={{ boxShadow: "0 2px 10px rgba(99,102,241,0.4)" }} />
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--text)" }}>VelixAI</span>
        </div>

        <div className="relative z-10 mt-auto">
          <p className="label mb-3">Why join VelixAI</p>
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

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            {(["details", "otp", "success"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  step === s
                    ? "text-white"
                    : (["details","otp","success"].indexOf(step) > i)
                    ? "text-white"
                    : "text-[var(--text-3)]"
                )} style={{
                  background: step === s
                    ? "var(--accent)"
                    : (["details","otp","success"].indexOf(step) > i)
                    ? "rgba(99,102,241,0.5)"
                    : "var(--bg)"
                }}>
                  {(["details","otp","success"].indexOf(step) > i) ? <Check size={10} style={{ pointerEvents: "all" }} /> : i + 1}
                </div>
                {i < 2 && <div className="w-6 h-px" style={{ background: "var(--border)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/logo.png" alt="VelixAI" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-bold tracking-tight" style={{ color: "var(--text)" }}>VelixAI</span>
          </div>

          {/* ── STEP 1: Details ───────────────────────────────────────── */}
          {step === "details" && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text)" }}>Create your account</h1>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>Personalised for the goals you just set</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="label block mb-1.5">Full Name</p>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)", pointerEvents: "none" }} />
                    <input
                      type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arjun Sharma" className="input pl-9" required autoFocus
                    />
                  </div>
                </div>

                <div>
                  <p className="label block mb-1.5">Email</p>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)", pointerEvents: "none" }} />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com" className="input pl-9" required
                    />
                  </div>
                </div>

                <div>
                  <p className="label block mb-1.5">Password</p>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)", pointerEvents: "none" }} />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" className="input pl-9" required
                    />
                  </div>
                </div>

                <div>
                  <p className="label block mb-1.5">Confirm Password</p>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)", pointerEvents: "none" }} />
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" className="input pl-9" required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-2.5 text-sm border"
                  style={{ background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)", color: "var(--red)" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !fullName || !email || !password || !confirmPassword}
                className="btn-primary w-full py-3 text-sm">
                {loading
                  ? <><Loader2 size={15} className="animate-spin" style={{ pointerEvents: "all" }} /> Sending code…</>
                  : <><span>Continue — Send Code</span><ArrowRight size={15} style={{ pointerEvents: "all" }} /></>
                }
              </button>

              <p className="text-sm text-center" style={{ color: "var(--text-2)" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in →</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="flex flex-col gap-5">
              <button onClick={() => setStep("details")} className="flex items-center gap-1.5 text-sm mb-2"
                style={{ color: "var(--text-3)" }}>
                <ArrowLeft size={14} style={{ pointerEvents: "all" }} /> Back
              </button>

              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <ShieldCheck size={22} style={{ color: "var(--accent)", pointerEvents: "all" }} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text)" }}>Check your inbox</h1>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  We sent a 6-digit code to<br />
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{email}</span>
                </p>
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all",
                      digit ? "border-[var(--accent)]" : "border-[var(--border)]"
                    )}
                    style={{
                      background: "var(--surface)",
                      color: "var(--text)",
                      caretColor: "var(--accent)",
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-xl px-4 py-2.5 text-sm border text-center"
                  style={{ background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)", color: "var(--red)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.some((d) => !d)}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" style={{ pointerEvents: "all" }} /> Verifying…</>
                  : <><span>Verify & Create Account</span><ArrowRight size={15} style={{ pointerEvents: "all" }} /></>
                }
              </button>

              <div className="text-center">
                <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>Didn't receive it? Check spam.</p>
                <button onClick={handleResend} disabled={resending}
                  className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Success ───────────────────────────────────────── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)" }}>
                <Check size={28} style={{ color: "var(--green)", pointerEvents: "all" }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>You're in! 🎉</h1>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Welcome to VelixAI, {fullName.split(" ")[0]}.<br />Taking you to your dashboard…
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
