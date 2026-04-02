import { create } from "zustand";
import { api } from "@/utils";

interface ReportState {
  sessionId: string | null;
  report: any | null;
  isLoading: boolean;
  error: string | null;
  setSessionId: (id: string) => void;
  fetchReport: (sessionId: string) => Promise<void>;
  // legacy compat
  fetchFeedback: (sessionId: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  sessionId: null,
  report: null,
  isLoading: false,
  error: null,

  setSessionId: (id) => set({ sessionId: id }),

  fetchReport: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.GET<any>(`/api/practice/sessions/${sessionId}/report`);
      set({ report: data, sessionId });
    } catch (e: any) {
      set({ error: "Could not load report" });
    } finally {
      set({ isLoading: false });
    }
  },

  // legacy compat
  fetchFeedback: async (sessionId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<any>(`/api/practice/sessions/${sessionId}/report`);
      set({ report: data, sessionId });
    } catch {
    } finally {
      set({ isLoading: false });
    }
  },
}));
