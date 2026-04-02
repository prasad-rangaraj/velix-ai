export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  NOT_AUTHORIZED: "/not-authorized",
  PLAYGROUND: "/playground",
  SELECT_TEST: "/select-test",
  FORGOT_PASSWORD: "/forgot-password",
  ONBOARDING: "/onboarding/:page",
  FEEDBACK: "/feedback/:page",
  REPORT: "/report/:page",
  ACCOUNTS: "/accounts",
  CHANGE_NAME: "accounts/change-name",
  CHANGE_EMAIL: "accounts/change-email",
  CHANGE_EMAIL_PASSWORD: "accounts/change-email-password",
  CHANGE_PASSWORD: "accounts/change-password",
  PROFILE: "/profile",
  VERIFICATION: "accounts/verification",
  VERIFIED: "accounts/verified",
  OLD_PASSWORD: "accounts/old-password",
  NEW_PASSWORD: "accounts/new-password",
  PRACTICE: "/practice",
  PRACTICE_SETUP: "/practice/setup",
  PRACTICE_FLOW: "/practice-flow/:page",
  DAILY_GOAL_SETUP: "/daily-goal/setup",
  DAILY_GOAL_CONTEXT: "/daily-goal/context",
  DAILY_GOAL_FLOW: "/daily-goal/:page",
};

export const STEPS = {
  FLUENCY: "fluency",
  PRONUNCIATION: "pronunciation",
  VOCABULARY: "vocabulary",
  GRAMMAR: "grammar",
  COMPLETION: "completion",
  VERIFIED: "verified",
  RATING: "rating",
  FEED_BACKUSER_DDETAILS: "feedbackuserdetails",
  VERFIFICATION: "verification",
  CREATE_PASSWORD: "createPassword",
  VIEW_REPORT: "viewreport",
  ACCENT: "accent",
  BADGE: "badge",
};

export const KEYS = {
  ONBOARDING: "onboarding",
  FEEDBACK: "feedback",
  REPORT: "report",
  PRACTICE_FLOW: "practice-flow",
  DAILY_GOAL_FLOW: "daily-goal",
};

export const ONBOARDING_PAGES = {
  AGE: "age",
  GENDER: "gender",
  SKILL: "skill",
  CONFIDENCE: "confidence",
  FEEL: "feel",
  USE: "use",
  AREA: "area",
  PERCENT: "percentage",
  DIFFICULTY: "difficulty",
  TRIPS: "trips",
  DIDYOUKNOW: "didyouknow",
  LEVEL: "level",
  CONTEXT: "context",
  CALL: "call",
  ONBOARDING_COMPLETION: "onboardingcompletion",
  STREAK: "streak",
  LEVELUP: "levelup",
  GOAL: "goal",
  CORRECTION: "correction",
  FLUENTLY: "fluently",
  READY: "ready",
} as const;

export const FLOW = [
  {
    key: KEYS.ONBOARDING,
    path: ROUTES.ONBOARDING,
    pages: [
      ONBOARDING_PAGES.AGE, ONBOARDING_PAGES.GENDER, ONBOARDING_PAGES.SKILL,
      ONBOARDING_PAGES.CONFIDENCE, ONBOARDING_PAGES.FEEL, ONBOARDING_PAGES.USE,
      ONBOARDING_PAGES.AREA, ONBOARDING_PAGES.PERCENT, ONBOARDING_PAGES.DIFFICULTY,
      ONBOARDING_PAGES.TRIPS, ONBOARDING_PAGES.DIDYOUKNOW, ONBOARDING_PAGES.LEVEL,
      ONBOARDING_PAGES.CONTEXT, ONBOARDING_PAGES.CALL, ONBOARDING_PAGES.ONBOARDING_COMPLETION,
      ONBOARDING_PAGES.STREAK, ONBOARDING_PAGES.LEVELUP, ONBOARDING_PAGES.GOAL,
      ONBOARDING_PAGES.CORRECTION, ONBOARDING_PAGES.FLUENTLY, ONBOARDING_PAGES.READY,
    ] as const,
  },
  {
    key: KEYS.FEEDBACK,
    path: ROUTES.FEEDBACK,
    pages: [STEPS.RATING, STEPS.COMPLETION, STEPS.FEED_BACKUSER_DDETAILS, STEPS.VERFIFICATION, STEPS.VERIFIED, STEPS.CREATE_PASSWORD] as const,
  },
  {
    key: KEYS.REPORT,
    path: ROUTES.REPORT,
    pages: [STEPS.VIEW_REPORT, STEPS.ACCENT, STEPS.FLUENCY, STEPS.PRONUNCIATION, STEPS.GRAMMAR, STEPS.VOCABULARY, STEPS.BADGE] as const,
  },
  {
    key: KEYS.PRACTICE_FLOW,
    path: ROUTES.PRACTICE_FLOW,
    pages: [ONBOARDING_PAGES.CALL, ONBOARDING_PAGES.ONBOARDING_COMPLETION, STEPS.VIEW_REPORT, STEPS.ACCENT, STEPS.FLUENCY, STEPS.PRONUNCIATION, STEPS.GRAMMAR, STEPS.VOCABULARY] as const,
  },
  {
    key: KEYS.DAILY_GOAL_FLOW,
    path: ROUTES.DAILY_GOAL_FLOW,
    pages: [ONBOARDING_PAGES.CALL, ONBOARDING_PAGES.ONBOARDING_COMPLETION, STEPS.VIEW_REPORT, STEPS.ACCENT, STEPS.FLUENCY, STEPS.PRONUNCIATION, STEPS.GRAMMAR, STEPS.VOCABULARY] as const,
  },
] as const;

export type StepKey = (typeof FLOW)[number]["key"];
export type PageKey<T extends StepKey> = Extract<(typeof FLOW)[number], { key: T }>["pages"][number];
