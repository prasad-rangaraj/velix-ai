import { cn } from "@/lib/utils";

interface ScoreRingProps {
  value: number;       // 0-100
  size?: number;       // px
  strokeWidth?: number;
  className?: string;
  label?: string;
  color?: string;
}

export const ScoreRing = ({
  value, size = 80, strokeWidth = 7, className, label, color,
}: ScoreRingProps) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 100) / 100);

  const getColor = () => {
    if (color) return color;
    if (value >= 80) return "#10b981"; // Emerald 500
    if (value >= 60) return "#f59e0b"; // Amber 500
    return "#ef4444"; // Red 500
  };

  const getLabel = () => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "Needs Work";
  };

  const id = Math.random().toString(36).substr(2, 9);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible filter drop-shadow-2xl">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor()} />
            <stop offset="100%" stopColor={getColor()} stopOpacity={0.6} />
          </linearGradient>
          <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={getColor()} floodOpacity="0.4" />
          </filter>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#grad-${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter={`url(#shadow-${id})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="relative" style={{ marginTop: -(size + 4) }}>
        <div style={{ width: size, height: size }}
          className="flex flex-col items-center justify-center">
          <span className="font-bold leading-none text-slate-800" style={{ fontSize: size * 0.26 }}>{value}</span>
          <span className="leading-none text-slate-400 font-medium" style={{ fontSize: size * 0.12, marginTop: 4 }}>/100</span>
        </div>
      </div>
      {label && (
        <div className="mt-2 text-center w-full max-w-[80px]">
          <p className="text-[9px] font-bold tracking-tight uppercase text-slate-500 truncate w-full" title={label}>{label}</p>
          <p className="text-[11px] mt-0.5 font-bold" style={{ color: getColor() }}>{getLabel()}</p>
        </div>
      )}
    </div>
  );
};
