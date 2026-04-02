import { create } from "zustand";
import { api } from "@/utils";

interface HomeState {
  streak: { count: number };
  xp: { count: number };
  dailyGoal: { current: number; target: number; percentage: number };
  skills: { label: string; value: number }[];
  recentSessions: any[];
  roadmap: any[];
  nextRoadmapItem: { title: string; stage: string } | null;
  vocabDueCount: number;
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
  fetchDailyGoal: () => Promise<void>;
  fetchLastSession: () => Promise<void>;
}

export const useHomeStore = create<HomeState>((set) => ({
  streak: { count: 0 },
  xp: { count: 0 },
  dailyGoal: { current: 0, target: 15, percentage: 0 },
  skills: [],
  recentSessions: [],
  roadmap: [],
  nextRoadmapItem: null,
  vocabDueCount: 0,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const [{ data }, roadmapRes] = await Promise.all([
        api.GET<any>("/api/dashboard/"),
        api.GET<any>("/api/practice/roadmap").catch(() => ({ data: { items: [] } })),
      ]);
      set({
        streak: { count: data.streak ?? 0 },
        xp: { count: data.total_xp ?? 0 },
        dailyGoal: {
          current: data.daily_goal?.current ?? 0,
          target: data.daily_goal?.target ?? 15,
          percentage: data.daily_goal?.percentage ?? 0,
        },
        skills: Object.entries(data.skills ?? {}).map(([k, v]) => ({
          label: k.charAt(0).toUpperCase() + k.slice(1),
          value: v as number,
        })),
        recentSessions: data.recent_sessions ?? [],
        roadmap: roadmapRes.data?.items ?? [],
        nextRoadmapItem: data.next_roadmap_item ?? null,
        vocabDueCount: data.vocab_due_count ?? 0,
      });
    } catch {
      // silently fail — page still renders with defaults
    } finally {
      set({ isLoading: false });
    }
  },

  // Legacy compat for existing Home component calls
  fetchDailyGoal: async () => {
    try {
      const { data } = await api.GET<any>("/api/dashboard/");
      set({
        streak: { count: data.streak ?? 0 },
        xp: { count: data.total_xp ?? 0 },
        dailyGoal: {
          current: data.daily_goal?.current ?? 0,
          target: data.daily_goal?.target ?? 15,
          percentage: data.daily_goal?.percentage ?? 0,
        },
      });
    } catch {}
  },
  fetchLastSession: async () => {
    try {
      const { data } = await api.GET<any>("/api/practice/sessions?limit=1");
      const sessions = data.sessions ?? [];
      if (sessions.length) set({ recentSessions: sessions });
    } catch {}
  },
}));
