import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/utils";
import { ArrowLeft, Headphones } from "lucide-react";

export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center gap-5 p-8">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-sm">
        <Headphones size={20} className="text-white" style={{ pointerEvents: "all" }} />
      </div>
      <div className="text-center">
        <p className="text-5xl font-bold text-slate-200 mb-2">404</p>
        <p className="text-xl font-semibold text-[var(--text)]">Page not found</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <button
        onClick={() => navigate(ROUTES.HOME)}
        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
      >
        <ArrowLeft size={14} style={{ pointerEvents: "all" }} /> Back to Dashboard
      </button>
    </div>
  );
};
