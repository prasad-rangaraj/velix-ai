import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  onboardingToken: string | null;
  name: string;
  email: string;
  ageGroup: string;
  gender: string;
  profession: string;
  setOnboardingToken: (token: string) => void;
  setField: (field: string, value: string) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingToken: null,
      name: "",
      email: "",
      ageGroup: "",
      gender: "",
      profession: "",
      setOnboardingToken: (token) => set({ onboardingToken: token }),
      setField: (field, value) => set((s) => ({ ...s, [field]: value })),
      resetOnboarding: () =>
        set({ onboardingToken: null, name: "", email: "", ageGroup: "", gender: "", profession: "" }),
    }),
    { name: "onboarding-storage" }
  )
);
