import { DISTRICTS } from "@/data/districts";
import { JOB_TYPES } from "@/types/job";
import { FAQ_QUICK_REPLIES, getWelcomeMessage, LINE_GUIDANCE, matchFaqAnswer } from "./faq-responder";
import { matchRecommendations } from "./recommendations";
import type { ChatPreferences, ChatRequest, ChatResponse, ChatSession } from "./types";

const RECOMMEND_START_TRIGGERS = [
  "おすすめ",
  "店舗を探",
  "求人を探",
  "マッチ",
  "紹介",
];

type CollectionStep = {
  question: string;
  quickReplies: string[];
  parse: (answer: string) => Partial<ChatPreferences> | null;
};

const COLLECTION_STEPS: CollectionStep[] = [
  {
    question: "希望のエリアを教えてください。",
    quickReplies: [...DISTRICTS, "こだわらない"],
    parse: (answer) => ({ district: answer }),
  },
  {
    question: "希望の職種を教えてください。",
    quickReplies: [...JOB_TYPES, "こだわらない"],
    parse: (answer) => ({ jobType: answer }),
  },
  {
    question: "希望の最低時給を教えてください。",
    quickReplies: ["2000円以上", "2500円以上", "3000円以上", "3500円以上", "4000円以上", "こだわらない"],
    parse: (answer) => {
      if (answer === "こだわらない") return {};
      const match = answer.match(/\d+/);
      return match ? { minSalary: Number(match[0]) } : {};
    },
  },
  {
    question: "未経験ですか？それとも経験者ですか？",
    quickReplies: ["未経験", "経験あり"],
    parse: (answer) => ({
      experience: answer.includes("未経験") ? "beginner" : "experienced",
    }),
  },
  {
    question: "お酒は飲めますか？",
    quickReplies: ["飲める", "飲めない（お酒NG希望）"],
    parse: (answer) => ({
      alcoholOk: answer.includes("飲める") && !answer.includes("飲めない"),
    }),
  },
  {
    question: "週に何回くらい働きたいですか？",
    quickReplies: ["週1〜2回", "週3〜4回", "週5回以上"],
    parse: (answer) => {
      if (answer.includes("週1")) return { daysPerWeek: 2 };
      if (answer.includes("週3")) return { daysPerWeek: 4 };
      if (answer.includes("週5")) return { daysPerWeek: 5 };
      return {};
    },
  },
  {
    question: "送迎は希望しますか？",
    quickReplies: ["送迎希望", "不要"],
    parse: (answer) => ({ wantsShuttle: answer.includes("送迎希望") }),
  },
  {
    question: "身バレが心配ですか？",
    quickReplies: ["身バレが心配", "特になし"],
    parse: (answer) => ({ privacyConcern: answer.includes("心配") }),
  },
];

function isRecommendStart(message: string, action?: string): boolean {
  if (action === "start_recommend") return true;
  const normalized = message.trim();
  return RECOMMEND_START_TRIGGERS.some((trigger) => normalized.includes(trigger));
}

function finishRecommendations(
  session: ChatSession,
  jobs: ChatRequest["jobs"],
  message: string,
): ChatResponse {
  const recommendations = matchRecommendations(jobs, session.preferences, message);

  if (recommendations.length === 0) {
    return {
      reply: `条件に合うおすすめ店舗が見つかりませんでした。条件を変えて再度お試しいただくか、${LINE_GUIDANCE}`,
      session: { mode: "idle", step: 0, preferences: {} },
      quickReplies: ["おすすめ店舗を探す", ...FAQ_QUICK_REPLIES.filter((q) => q !== "おすすめ店舗を探す")],
    };
  }

  return {
    reply: `条件に合いそうなお店を${recommendations.length}件ピックアップしました。詳しくは各求人ページをご覧ください。\n\n${LINE_GUIDANCE}`,
    session: { mode: "done", step: COLLECTION_STEPS.length, preferences: session.preferences },
    recommendations,
    quickReplies: ["おすすめ店舗を探す", "未経験でも働ける？"],
  };
}

function handleCollecting(
  message: string,
  session: ChatSession,
  jobs: ChatRequest["jobs"],
): ChatResponse {
  const step = COLLECTION_STEPS[session.step];
  if (!step) {
    return finishRecommendations(session, jobs, message);
  }

  const parsed = step.parse(message.trim());
  if (!parsed && message.trim()) {
    return {
      reply: `選択肢からお選びいただくか、表示されているキーワードを含めて送ってください。\n\n${step.question}`,
      session,
      quickReplies: step.quickReplies,
    };
  }

  const nextPreferences = { ...session.preferences, ...parsed };
  const nextStep = session.step + 1;

  if (nextStep >= COLLECTION_STEPS.length) {
    return finishRecommendations(
      { mode: "collecting", step: nextStep, preferences: nextPreferences },
      jobs,
      message,
    );
  }

  const next = COLLECTION_STEPS[nextStep];
  return {
    reply: next.question,
    session: { mode: "collecting", step: nextStep, preferences: nextPreferences },
    quickReplies: next.quickReplies,
  };
}

export function processChat(request: ChatRequest): ChatResponse {
  const { message, session, action, jobs } = request;
  const trimmed = message.trim();

  if (session.mode === "collecting") {
    return handleCollecting(trimmed || message, session, jobs);
  }

  if (session.mode === "done" && isRecommendStart(trimmed, action)) {
    const first = COLLECTION_STEPS[0];
    return {
      reply: `かしこまりました。いくつか質問させてください。\n\n${first.question}`,
      session: { mode: "collecting", step: 0, preferences: {} },
      quickReplies: first.quickReplies,
    };
  }

  if (isRecommendStart(trimmed, action)) {
    const first = COLLECTION_STEPS[0];
    return {
      reply: `おすすめ店舗のご案内ですね。いくつか質問させてください。\n\n${first.question}`,
      session: { mode: "collecting", step: 0, preferences: {} },
      quickReplies: first.quickReplies,
    };
  }

  const faqAnswer = matchFaqAnswer(trimmed);
  if (faqAnswer) {
    const keywordRecs = matchRecommendations(jobs, {}, trimmed, 3);
    return {
      reply: faqAnswer,
      session: { mode: "idle", step: 0, preferences: {} },
      recommendations: keywordRecs.length > 0 ? keywordRecs : undefined,
      quickReplies: FAQ_QUICK_REPLIES,
    };
  }

  if (!trimmed) {
    return {
      reply: getWelcomeMessage(),
      session: { mode: "idle", step: 0, preferences: {} },
      quickReplies: FAQ_QUICK_REPLIES,
    };
  }

  return {
    reply: `ご質問ありがとうございます。夜職に関するよくある質問にお答えできます。下のボタンから選ぶか、「おすすめ店舗を探す」と送ってみてください。\n\n${LINE_GUIDANCE}`,
    session: { mode: "idle", step: 0, preferences: {} },
    quickReplies: FAQ_QUICK_REPLIES,
  };
}

export function createInitialSession(): ChatSession {
  return { mode: "idle", step: 0, preferences: {} };
}

export { getWelcomeMessage, FAQ_QUICK_REPLIES };
