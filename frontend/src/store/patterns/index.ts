import { create } from "zustand";
import { api } from "@/utils";

interface PatternsState {
  patterns: any | null;
  isLoading: boolean;
  fetchPatterns: () => Promise<void>;
}

export const usePatternsStore = create<PatternsState>((set) => ({
  patterns: null,
  isLoading: false,
  fetchPatterns: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<any>("/api/patterns");
      set({ patterns: data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
