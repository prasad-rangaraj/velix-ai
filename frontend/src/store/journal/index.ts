import { create } from "zustand";
import { api } from "@/utils";

export interface JournalEntry {
  id: number;
  created_at: string;
  duration_seconds: number;
  fluency_score: number;
  vocab_score: number;
  confidence_score: number;
  new_words: string[];
  transcript: string;
}

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  fetchEntries: () => Promise<void>;
  submitEntry: (data: { transcript: string; duration_seconds: number }) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  isLoading: false,
  isSubmitting: false,

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<any>("/api/journal/entries");
      set({ entries: data.entries ?? [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  submitEntry: async (entryData) => {
    set({ isSubmitting: true });
    try {
      // Auto-generate some basic scores based on duration and transcript length
      const wordCount = entryData.transcript.split(" ").length;
      const wpm = (wordCount / (Math.max(1, entryData.duration_seconds) / 60));
      
      const fluency = Math.min(100, Math.max(0, Math.round((wpm / 150) * 100)));
      const vocab = Math.min(100, Math.round(50 + (wordCount * 0.5)));
      const confidence = Math.min(100, Math.round(60 + (wpm * 0.2)));

      await api.POST("/api/journal/entries", {
        transcript: entryData.transcript || "No transcript recorded.",
        duration_seconds: entryData.duration_seconds,
        fluency_score: fluency,
        vocab_score: vocab,
        confidence_score: confidence,
        new_words: []
      });
      await get().fetchEntries();
    } catch (e) {
      console.error(e);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
