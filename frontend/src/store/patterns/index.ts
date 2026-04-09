import { create } from "zustand";
import { api } from "@/utils";

interface PatternsState {
  patterns: any | null;
  isLoading: boolean;
  error: string | null;
  fetchPatterns: () => Promise<void>;
}

export const usePatternsStore = create<PatternsState>((set) => ({
  patterns: null,
  isLoading: false,
  error: null,
  fetchPatterns: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.GET<any>("/api/patterns");
      set({ patterns: data });
    } catch (e: any) {
      console.error(e);
      set({ error: e.message || "Failed to fetch communication patterns" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
