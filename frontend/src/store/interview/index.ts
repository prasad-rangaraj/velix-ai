import { create } from "zustand";
import { api } from "@/utils";

export interface InterviewQuestion {
  q: string;
  weight: "high" | "medium" | "low";
  star_hint: string;
}

export interface CultureSignals {
  tone: string;
  seniority: string;
  is_startup: boolean;
  is_corp: boolean;
}

export interface InterviewSession {
  id: number;
  company_name: string;
  created_at: string;
  question_count: number;
}

interface InterviewState {
  activeSessionId: number | null;
  questions: InterviewQuestion[];
  cultureSignals: CultureSignals | null;
  domainVocab: string[];
  pastSessions: InterviewSession[];
  isLoading: boolean;

  analyzeJD: (jd: string, company?: string) => Promise<void>;
  fetchPastSessions: () => Promise<void>;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  activeSessionId: null,
  questions: [],
  cultureSignals: null,
  domainVocab: [],
  pastSessions: [],
  isLoading: false,

  fetchPastSessions: async () => {
    try {
      const { data } = await api.GET<any>("/api/interview/sessions");
      set({ pastSessions: data.sessions || [] });
    } catch (e) {
      console.error(e);
    }
  },

  analyzeJD: async (jd, company = "Unknown Company") => {
    set({ isLoading: true });
    try {
      const { data } = await api.POST<any>("/api/interview/analyze", {
        job_description: jd,
        company_name: company
      });
      set({
        activeSessionId: data.session_id,
        questions: data.questions,
        cultureSignals: data.culture_signals,
        domainVocab: data.domain_vocab,
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ activeSessionId: null, questions: [], cultureSignals: null, domainVocab: [] })
}));
