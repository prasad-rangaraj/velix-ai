import { create } from "zustand";
import { api } from "@/utils";

export interface AnxietyAssessment {
  score: number;
  level: "low" | "moderate" | "high";
  created_at?: string;
}

export interface CBTExercise {
  id: string;
  title: string;
  duration?: string;
  description: string;
  steps: string[];
}

interface AnxietyState {
  latestAssessment: AnxietyAssessment | null;
  exercises: CBTExercise[];
  warmupSteps: string[];
  isLoading: boolean;

  fetchInitialData: () => Promise<void>;
  submitAssessment: (answers: number[]) => Promise<void>;
  logExercise: (exercise_type: string, warmup_step?: string) => Promise<void>;
}

export const useAnxietyStore = create<AnxietyState>((set, get) => ({
  latestAssessment: null,
  exercises: [],
  warmupSteps: [],
  isLoading: false,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [{ data: aData }, { data: eData }, { data: wData }] = await Promise.all([
        api.GET<any>("/api/anxiety/assessment/latest"),
        api.GET<any>("/api/anxiety/exercises"),
        api.GET<any>("/api/anxiety/warmup")
      ]);
      set({
        latestAssessment: aData?.assessment || null,
        exercises: eData?.exercises || [],
        warmupSteps: wData?.steps || [],
      });
    } catch (e) {
      console.error("Failed to fetch anxiety data", e);
    } finally {
      set({ isLoading: false });
    }
  },

  submitAssessment: async (answers) => {
    try {
      const { data } = await api.POST<any>("/api/anxiety/assessment", { answers });
      set({ latestAssessment: { score: data.score, level: data.level } });
    } catch (e) {
      console.error(e);
    }
  },

  logExercise: async (exercise_type, warmup_step) => {
    try {
      await api.POST("/api/anxiety/exercises/log", { exercise_type, warmup_step });
    } catch (e) {
      console.error(e);
    }
  }
}));
