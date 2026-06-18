export type ChatPreferences = {
  district?: string;
  jobType?: string;
  minSalary?: number;
  experience?: "beginner" | "experienced";
  alcoholOk?: boolean;
  daysPerWeek?: number;
  wantsShuttle?: boolean;
  privacyConcern?: boolean;
};

export type ChatSessionMode = "idle" | "collecting" | "done";

export type ChatSession = {
  mode: ChatSessionMode;
  step: number;
  preferences: ChatPreferences;
};

export type ChatRecommendation = {
  id: string;
  shopName: string;
  area: string;
  district: string;
  jobType: string;
  salary: string;
  reason: string;
  lineUrl: string;
};

export type ChatJob = {
  id: string;
  shopName: string;
  area: string;
  district: string;
  jobType: string;
  salary: string;
  lineUrl: string;
  chatRecommend: {
    enabled: boolean;
    priority: number;
    comment?: string;
    beginner: boolean;
    noAlcoholOk: boolean;
    shuttle: boolean;
    privacy: boolean;
    highSalary: boolean;
    relaxed: boolean;
    highEarning: boolean;
  };
};

export type ChatResponse = {
  reply: string;
  session: ChatSession;
  recommendations?: ChatRecommendation[];
  quickReplies?: string[];
};

export type ChatRequest = {
  message: string;
  session: ChatSession;
  action?: "start_recommend";
  jobs: ChatJob[];
};
