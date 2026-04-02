import { create } from "zustand";
import { api } from "@/utils";

export interface Culture {
  id: string;
  flag: string;
  name: string;
  region?: string;
  directness: number;
  hierarchy: number;
  formality: number;
  norms?: string[];
  taboos?: string[];
  tips?: string[];
  greeting?: string;
  daily_phrase?: string;
}

interface CultureState {
  cultures: Culture[];
  selectedCulture: Culture | null;
  isLoadingList: boolean;
  isLoadingDetail: boolean;

  fetchCultures: () => Promise<void>;
  selectCulture: (id: string) => Promise<void>;
}

export const useCultureStore = create<CultureState>((set) => ({
  cultures: [],
  selectedCulture: null,
  isLoadingList: false,
  isLoadingDetail: false,

  fetchCultures: async () => {
    set({ isLoadingList: true });
    try {
      const { data } = await api.GET<any>("/api/culture/");
      set({ cultures: data.cultures || [] });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoadingList: false });
    }
  },

  selectCulture: async (id: string) => {
    set({ isLoadingDetail: true });
    try {
      const { data } = await api.GET<any>(`/api/culture/${id}`);
      set({ selectedCulture: data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoadingDetail: false });
    }
  }
}));
