import { create } from "zustand";
import { api } from "@/utils";

export interface ConferenceSession {
  id: number;
  meeting_type: string;
  duration_seconds: number;
  avg_confidence: number;
  created_at: string;
}

export interface TranscriptTurn {
  speaker: string;
  text: string;
  confidence_at?: number;
}

interface ConferenceState {
  activeSessionId: number | null;
  meetingType: string | null;
  transcript: TranscriptTurn[];
  pastSessions: ConferenceSession[];
  isLoading: boolean;
  isEnding: boolean;

  fetchPastSessions: () => Promise<void>;
  startConference: (meetingType: string, personasUsed?: string[]) => Promise<void>;
  addTranscriptTurn: (speaker: string, text: string, confidence?: number) => Promise<void>;
  endConference: (duration_seconds: number, avg_confidence: number, tips_shown: number) => Promise<void>;
  reset: () => void;
}

export const useConferenceStore = create<ConferenceState>((set, get) => ({
  activeSessionId: null,
  meetingType: null,
  transcript: [],
  pastSessions: [],
  isLoading: false,
  isEnding: false,

  fetchPastSessions: async () => {
    try {
      const { data } = await api.GET<any>("/api/conference/sessions");
      set({ pastSessions: data.sessions || [] });
    } catch (e) {
      console.error(e);
    }
  },

  startConference: async (meetingType, personasUsed = ["director", "skeptic", "ally", "observer"]) => {
    set({ isLoading: true });
    try {
      const { data } = await api.POST<any>("/api/conference/sessions", {
        meeting_type: meetingType,
        personas_used: personasUsed,
      });
      set({ activeSessionId: data.session_id, meetingType, transcript: [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  addTranscriptTurn: async (speaker, text, confidence) => {
    const state = get();
    if (!state.activeSessionId) return;

    // Optimistically update UI
    set({ transcript: [...state.transcript, { speaker, text, confidence_at: confidence }] });

    try {
      await api.POST(`/api/conference/sessions/${state.activeSessionId}/transcript`, {
        speaker,
        text,
        confidence_at: confidence
      });
    } catch (e) {
      console.error(e);
    }
  },

  endConference: async (duration, avgConfidence, tipsShown) => {
    const state = get();
    if (!state.activeSessionId) return;
    
    set({ isEnding: true });
    try {
      await api.PATCH(`/api/conference/sessions/${state.activeSessionId}/end`, {
        duration_seconds: duration,
        avg_confidence: avgConfidence,
        coaching_tips_shown: tipsShown,
      });
      await get().fetchPastSessions();
      set({ activeSessionId: null, meetingType: null, transcript: [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isEnding: false });
    }
  },

  reset: () => set({ activeSessionId: null, meetingType: null, transcript: [] })
}));
