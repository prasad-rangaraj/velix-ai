import { create } from "zustand";
import { api } from "@/utils";

interface Profile {
  id: number;
  email: string;
  full_name: string;
  avatar_initials: string;
  language_level: string;
  profession: string | null;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  streak_freeze_count: number;
  streak_frozen_today: boolean;
  daily_goal_minutes: number;
  weekly_session_target: number;
  notification_prefs: Record<string, boolean>;
  skills: Record<string, number>;
}

interface Stats {
  total_sessions: number;
  total_minutes: number;
  total_xp: number;
  current_streak: number;
}

interface ProfileState {
  profile: Profile | null;
  stats: Stats | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "daily_goal_minutes" | "weekly_session_target" | "notification_prefs" | "language_level" | "profession">>) => Promise<void>;
  useStreakFreeze: () => Promise<{ ok: boolean; freezes_remaining: number } | null>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  stats: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<Profile>("/api/user/me");
      set({ profile: data });
    } catch {} finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.GET<Stats>("/api/user/me/stats");
      set({ stats: data });
    } catch {}
  },

  updateProfile: async (patch) => {
    try {
      await api.PATCH("/api/user/me", patch);
      set((s) => ({ profile: s.profile ? { ...s.profile, ...patch } : null }));
    } catch {}
  },

  useStreakFreeze: async () => {
    try {
      const { data } = await api.POST<any>("/api/user/me/streak-freeze");
      set((s) => ({
        profile: s.profile
          ? { ...s.profile, streak_frozen_today: true, streak_freeze_count: data.freezes_remaining }
          : null,
      }));
      return data;
    } catch { return null; }
  },
}));
