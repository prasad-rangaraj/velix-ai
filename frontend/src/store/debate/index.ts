import { create } from "zustand";
import { api } from "@/utils";

export interface DebateArgument {
  side: "user" | "ai";
  text: string;
  score?: { claim: number; evidence: number; rebuttal: number; };
}

export interface DebateSession {
  id: number;
  topic: string;
  rounds: number;
  created_at: string;
}

interface DebateState {
  activeSessionId: number | null;
  topic: string | null;
  args: DebateArgument[];
  roundCount: number;
  pastSessions: DebateSession[];
  isLoading: boolean;
  isSubmitting: boolean;

  fetchPastSessions: () => Promise<void>;
  startDebate: (topic: string, category?: string) => Promise<void>;
  submitArgument: (text: string) => Promise<void>;
  resetDebate: () => void;
}

export const useDebateStore = create<DebateState>((set, get) => ({
  activeSessionId: null,
  topic: null,
  args: [],
  roundCount: 0,
  pastSessions: [],
  isLoading: false,
  isSubmitting: false,

  fetchPastSessions: async () => {
    try {
      const { data } = await api.GET<any>("/api/debate/sessions");
      set({ pastSessions: data.sessions || [] });
    } catch (e) {
      console.error(e);
    }
  },

  startDebate: async (topic, category = "Business") => {
    set({ isLoading: true });
    try {
      const { data } = await api.POST<any>("/api/debate/sessions", { topic, category });
      set({ 
        activeSessionId: data.session_id, 
        topic: data.topic, 
        args: [{ side: "ai", text: `I will argue against: "${data.topic}". Make your opening argument — support your position with evidence and a clear claim.` }],
        roundCount: 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  submitArgument: async (text) => {
    const state = get();
    if (!state.activeSessionId) return;

    // Optimistically add user argument
    set({ 
      isSubmitting: true,
      args: [...state.args, { side: "user", text }]
    });

    try {
      const { data } = await api.POST<any>(`/api/debate/sessions/${state.activeSessionId}/argue`, { text });
      
      const newArgs = get().args.map((a, idx) => 
        (idx === get().args.length - 1 && a.side === "user") ? { ...a, score: data.user_scores } : a
      );

      if (data.fallacy) {
        newArgs.push({ side: "ai", text: `🔍 Fallacy detected: ${data.fallacy}` });
      }
      
      newArgs.push({ side: "ai", text: data.ai_response });

      set({ 
        args: newArgs,
        roundCount: state.roundCount + 1,
      });

      await get().fetchPastSessions();
    } catch (e) {
      console.error(e);
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetDebate: () => set({ activeSessionId: null, topic: null, args: [], roundCount: 0 })
}));
