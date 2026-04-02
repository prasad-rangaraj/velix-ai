import { cn } from "@/lib/utils";

interface Day {
  date: string; // YYYY-MM-DD
  count: number; // sessions that day
}

interface ActivityCalendarProps {
  data: Day[];
  className?: string;
}

const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getColor = (minutes: number) => {
  if (minutes === 0) return "bg-slate-100 border border-slate-200 outline outline-1 outline-offset-1 outline-transparent";
  if (minutes < 15) return "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.3)] border border-emerald-400";
  if (minutes < 45) return "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] border border-emerald-500 scale-105";
  return "bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)] border border-emerald-600 scale-110";
};

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Helper to generate the exact structure of a single month (columns of weeks, 7 rows of days)
const buildMonthCalendar = (year: number, month: number, lookup: Record<string, number>) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const columns: ({ date: string; count: number } | null)[][] = [];
  let currentColumn: ({ date: string; count: number } | null)[] = new Array(7).fill(null);
  
  let currentDayOfWeek = firstDay;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    currentColumn[currentDayOfWeek] = { date: dateStr, count: lookup[dateStr] || 0 };
    
    if (currentDayOfWeek === 6 || d === daysInMonth) {
      columns.push([...currentColumn]);
      if (d !== daysInMonth) {
        currentColumn = new Array(7).fill(null);
        currentDayOfWeek = 0;
      }
    } else {
      currentDayOfWeek++;
    }
  }
  
  return columns;
};

// Generates the past 12 months including current month
const buildYearlyCalendars = (data: Day[]) => {
  const lookup = Object.fromEntries(data.map((d) => [d.date, d.count]));
  const today = new Date();
  const monthsData = [];

  for (let m = 11; m >= 0; m--) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const yr = targetDate.getFullYear();
    const mo = targetDate.getMonth();
    monthsData.push({
      name: MONTHS[mo],
      year: yr,
      columns: buildMonthCalendar(yr, mo, lookup)
    });
  }
  return monthsData;
};

export const ActivityCalendar = ({ data, className }: ActivityCalendarProps) => {
  const [selectedYear, setSelectedYear] = useState("Current");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const monthsData = buildYearlyCalendars(data); // In actual prod, filter `data` by selectedYear
  
  // Calculate stats for the header
  const totalActiveDays = data.filter(d => d.count > 0).length;
  // Simple streak calc for UI parity
  let maxStreak = 0;
  let currentStreak = 0;
  const sortedDays = [...data].sort((a,b) => a.date.localeCompare(b.date));
  for (const d of sortedDays) {
    if (d.count > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return (
    <div className={cn("flex flex-col select-none", className)}>
      {/* Header (Stats & Dropdown) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6 text-sm">
          <p className="text-slate-400">Total active days: <span className="font-bold text-slate-700 ml-1">{totalActiveDays}</span></p>
          <p className="text-slate-400">Max streak: <span className="font-bold text-slate-700 ml-1">{maxStreak}</span></p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            {selectedYear} <ChevronDown size={14} className="text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-10">
              {["Current", "2025", "2024"].map(yr => (
                <button 
                  key={yr} 
                  onClick={() => { setSelectedYear(yr); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium">
                  {yr}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid Array */}
      <div className="flex gap-[18px] overflow-x-auto pb-4 custom-scrollbar">
        {monthsData.map((month, mi) => (
          <div key={`${month.year}-${month.name}`} className="flex flex-col shrink-0">
            <div className="flex gap-[3px]">
              {month.columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((cell, rowI) => {
                    if (!cell) {
                      return <div key={`empty-${rowI}`} className="w-[11px] h-[11px] rounded-[2px]" />;
                    }
                    return (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.count} mins practiced`}
                        className={cn("w-[11px] h-[11px] rounded-[2px] transition-all hover:ring-1 hover:ring-slate-400 cursor-default", getColor(cell.count))}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">{month.name}</p>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <span className="text-[11px] text-slate-400 font-medium">Less</span>
        {[0, 10, 30, 60].map((c) => (
          <div key={c} className={cn("w-[11px] h-[11px] rounded-[2px]", getColor(c))} />
        ))}
        <span className="text-[11px] text-slate-400 font-medium ml-1">More</span>
      </div>
    </div>
  );
};
