import { create } from "zustand";
import { api } from "@/utils";

interface ProgressState {
  overview: {
    total_sessions: number;
    total_minutes: number;
    avg_score: number;
    current_streak: number;
    total_xp: number;
    skills: Record<string, number>;
    recent_sessions: { 
      id: number;
      title: string;
      date: string; 
      minutes: number;
      score: number;
      xp: number;
    }[];
  } | null;
  achievements: { key: string; icon: string; label: string; earned: boolean }[];
  isLoading: boolean;
  fetchOverview: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  overview: null,
  achievements: [],
  isLoading: false,

  fetchOverview: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<any>("/api/progress/overview");
      set({ overview: data });
    } catch {} finally { set({ isLoading: false }); }
  },

  fetchAchievements: async () => {
    try {
      const { data } = await api.GET<any>("/api/progress/achievements");
      set({ achievements: data.achievements ?? [] });
    } catch {}
  },
}));
