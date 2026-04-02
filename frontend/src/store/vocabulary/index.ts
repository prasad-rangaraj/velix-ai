import { create } from "zustand";
import { api } from "@/utils";

interface VocabWord {
  id: number;
  word: string;
  phonetic: string | null;
  definition: string | null;
  example_sentence: string | null;
  articulation_tip: string | null;
  phonemes: { symbol: string; sound: string; tip: string }[];
  saved_from: string | null;
  difficulty: string;
  is_mastered: boolean;
  times_reviewed: number;
  next_review_at: string | null;
}

interface VocabularyState {
  words: VocabWord[];
  reviewQueue: VocabWord[];
  isLoading: boolean;
  fetchWords: (search?: string) => Promise<void>;
  fetchReviewQueue: () => Promise<void>;
  addWord: (word: Omit<VocabWord, "id" | "is_mastered" | "times_reviewed" | "next_review_at">) => Promise<void>;
  deleteWord: (id: number) => Promise<void>;
  submitReview: (wordId: number, rating: "easy" | "hard" | "skip") => Promise<void>;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  words: [],
  reviewQueue: [],
  isLoading: false,

  fetchWords: async (search) => {
    set({ isLoading: true });
    try {
      const { data } = await api.GET<any>("/api/vocabulary/words", search ? { search } : undefined);
      set({ words: data.words ?? [] });
    } catch {} finally { set({ isLoading: false }); }
  },

  fetchReviewQueue: async () => {
    try {
      const { data } = await api.GET<any>("/api/vocabulary/review");
      set({ reviewQueue: data.words ?? [] });
    } catch {}
  },

  addWord: async (word) => {
    try {
      await api.POST("/api/vocabulary/words", word);
      await get().fetchWords();
    } catch {}
  },

  deleteWord: async (id) => {
    try {
      await api.DELETE(`/api/vocabulary/words/${id}`);
      set((s) => ({ words: s.words.filter((w) => w.id !== id) }));
    } catch {}
  },

  submitReview: async (wordId, rating) => {
    try {
      await api.POST("/api/vocabulary/review", { word_id: wordId, rating });
      await get().fetchReviewQueue();
    } catch {}
  },
}));
