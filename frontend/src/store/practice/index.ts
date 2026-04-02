import { create } from "zustand";
import { api } from "@/utils";

interface PracticeState {
  sessionId: number | null;
  status: "idle" | "active" | "completing";
  scenarios: any[];
  roadmap: any[];
  recentSessions: any[];
  fetchScenarios: () => Promise<void>;
  fetchRoadmap: () => Promise<void>;
  fetchRecentSessions: () => Promise<void>;
  startSession: (scenarioId?: string, customPrompt?: string, type?: string) => Promise<number | null>;
  completeSession: (sessionId: number, data: any) => Promise<{ xp_earned: number } | null>;
  addTurn: (sessionId: number, speaker: string, transcript: string) => Promise<void>;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  sessionId: null,
  status: "idle",
  scenarios: [],
  roadmap: [],
  recentSessions: [],

  fetchScenarios: async () => {
    try {
      const { data } = await api.GET<any>("/api/practice/scenarios");
      set({ scenarios: data.scenarios ?? [] });
    } catch {}
  },

  fetchRoadmap: async () => {
    try {
      const { data } = await api.GET<any>("/api/practice/roadmap");
      set({ roadmap: data.items ?? [] });
    } catch {}
  },

  fetchRecentSessions: async () => {
    try {
      const { data } = await api.GET<any>("/api/practice/sessions?limit=5");
      set({ recentSessions: data.sessions ?? [] });
    } catch {}
  },

  startSession: async (scenarioId, customPrompt, type = "preset") => {
    try {
      const { data } = await api.POST<any>("/api/practice/sessions", {
        scenario_id: scenarioId,
        custom_prompt: customPrompt,
        session_type: type,
      });
      set({ sessionId: data.session_id, status: "active" });
      return data.session_id;
    } catch { return null; }
  },

  completeSession: async (sessionId, payload) => {
    set({ status: "completing" });
    try {
      const { data } = await api.PATCH<any>(`/api/practice/sessions/${sessionId}/complete`, payload);
      set({ status: "idle", sessionId: null });
      return data;
    } catch {
      set({ status: "idle" });
      return null;
    }
  },

  addTurn: async (sessionId, speaker, transcript) => {
    try {
      await api.POST(`/api/practice/sessions/${sessionId}/turns`, { speaker, transcript });
    } catch {}
  },
}));
