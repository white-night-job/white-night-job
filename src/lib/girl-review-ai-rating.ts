import OpenAI from "openai";
import { isOpenAiConfigured } from "@/lib/chat/ai-responder";

export type GirlReviewStarRating = 1 | 2 | 3 | 4 | 5;

export type GirlReviewAiRatingResult = {
  /** 公開用（80文字キャップ適用後） */
  rating: GirlReviewStarRating;
  /** AI生判定（キャップ適用前） */
  aiRating: GirlReviewStarRating;
  /** 運営向け判定理由 */
  reason: string;
};

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは夜職求人サイトの口コミ評価AIです。
口コミ本文のみを分析し、星評価（1〜5）と短い日本語の判定理由を返してください。

評価基準:
- 5: 非常に高評価。具体的な体験談があり、内容が充実している
- 4: 高評価。内容は良いがやや短い、または具体性がやや弱い
- 3: 良い点と改善点が混在
- 2: 不満点が多い
- 1: 非常に低評価。求人内容との大きな相違や強い不満

重要:
- 星5は「非常に高評価」かつ「具体的な体験談」がある場合のみ候補にする
- 文字数の最終キャップ（80文字未満なら5不可）はシステム側で行うので、まず内容品質で1〜5を判定する
- 理由は1文、40〜80文字程度。例:「具体的な体験談があり、内容も充実しているため★★★★★」
- JSONのみ返す: {"rating":1〜5の整数,"reason":"日本語の理由"}`;

function clampStar(value: unknown): GirlReviewStarRating {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n)) as GirlReviewStarRating;
}

/** 口コミ本文の文字数（サロゲートペア対応） */
export function countReviewCommentChars(comment: string): number {
  return [...comment.trim()].length;
}

/**
 * ★5 は「AIが5」かつ「本文80文字以上」のときのみ。
 * それ以外で AI が5なら ★4 に落とす。
 */
export function applyFiveStarLengthCap(
  aiRating: GirlReviewStarRating,
  comment: string,
  reason: string,
): GirlReviewAiRatingResult {
  const length = countReviewCommentChars(comment);
  if (aiRating === 5 && length < 80) {
    return {
      rating: 4,
      aiRating,
      reason: "高評価だが文字数が少ないため★★★★☆",
    };
  }
  return {
    rating: aiRating,
    aiRating,
    reason: reason.trim() || defaultReasonForRating(aiRating),
  };
}

function defaultReasonForRating(rating: GirlReviewStarRating): string {
  switch (rating) {
    case 5:
      return "具体的な体験談があり、内容も充実しているため★★★★★";
    case 4:
      return "高評価の内容のため★★★★☆";
    case 3:
      return "良い点と改善点が混在しているため★★★☆☆";
    case 2:
      return "不満点が多い内容のため★★☆☆☆";
    case 1:
      return "非常に低評価・強い不満が含まれるため★☆☆☆☆";
  }
}

function heuristicEvaluate(comment: string): GirlReviewAiRatingResult {
  const text = comment.trim();
  const length = countReviewCommentChars(text);
  const lower = text.toLowerCase();

  const strongNegative = [
    "詐欺",
    "騙",
    "うそ",
    "嘘",
    "最悪",
    "二度と",
    "求人と違う",
    "書いてあることと違う",
    "強制",
    "危険",
    "怖",
  ];
  const negative = [
    "不満",
    "つらい",
    "きつい",
    "微妙",
    "残念",
    "がっかり",
    "遅い",
    "ひどい",
    "合わない",
  ];
  const positive = [
    "安心",
    "優しい",
    "丁寧",
    "楽しい",
    "おすすめ",
    "良かった",
    "よかった",
    "アットホーム",
    "サポート",
    "働きやすい",
    "嬉しい",
    "ありがたい",
  ];
  const concrete = [
    "面接",
    "体入",
    "体験",
    "時給",
    "日給",
    "店長",
    "ママ",
    "キャスト",
    "スタッフ",
    "初日",
    "案内",
    "説明",
  ];

  const has = (words: string[]) => words.some((w) => lower.includes(w));
  let aiRating: GirlReviewStarRating = 3;

  if (has(strongNegative)) {
    aiRating = 1;
  } else if (has(negative) && !has(positive)) {
    aiRating = 2;
  } else if (has(positive) && has(negative)) {
    aiRating = 3;
  } else if (has(positive) && has(concrete) && length >= 80) {
    aiRating = 5;
  } else if (has(positive)) {
    aiRating = 4;
  } else if (length >= 80 && has(concrete)) {
    aiRating = 4;
  }

  return applyFiveStarLengthCap(
    aiRating,
    text,
    defaultReasonForRating(aiRating),
  );
}

async function evaluateWithOpenAi(
  comment: string,
): Promise<GirlReviewAiRatingResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `口コミ本文（${countReviewCommentChars(comment)}文字）:\n${comment.trim()}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(raw) as { rating?: unknown; reason?: unknown };
  const aiRating = clampStar(parsed.rating);
  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : defaultReasonForRating(aiRating);

  return applyFiveStarLengthCap(aiRating, comment, reason);
}

/**
 * 口コミ本文から星評価を自動判定する。
 * OpenAI 利用不可・失敗時はヒューリスティックにフォールバックする。
 */
export async function evaluateGirlReviewRating(
  comment: string,
): Promise<GirlReviewAiRatingResult> {
  if (!comment.trim()) {
    return applyFiveStarLengthCap(3, comment, defaultReasonForRating(3));
  }

  if (!isOpenAiConfigured()) {
    return heuristicEvaluate(comment);
  }

  try {
    return await evaluateWithOpenAi(comment);
  } catch (error) {
    console.error("[girl-review-ai-rating] OpenAI failed, using heuristic", error);
    return heuristicEvaluate(comment);
  }
}
