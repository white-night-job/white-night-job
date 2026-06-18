export type ChatPreferences = {
  district?: string;
  jobType?: string;
  minSalary?: number;
  experience?: "beginner" | "experienced";
  alcoholOk?: boolean;
  daysPerWeek?: number;
  wantsShuttle?: boolean;
  privacyConcern?: boolean;
  wantsWeeklyOnce?: boolean;
  wantsDailyPay?: boolean;
  noQuota?: boolean;
  noPenalty?: boolean;
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
  benefits: string[];
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

export type ChatApiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatApiResponse = {
  reply: string;
  recommendations: ChatRecommendation[];
};
