import OpenAI from "openai";
import { isOpenAiConfigured } from "@/lib/chat/ai-responder";

export type MainImageQuality = "good" | "weak" | "poor" | "missing";

export type MainImageAssessment = {
  quality: MainImageQuality;
  /** 画像の短い説明（運営・デバッグ向けにも使える） */
  summary: string;
  needsHighPriorityFix: boolean;
  issue: string;
  action: string;
  expectedEffect: string;
  reason: string;
};

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは夜職求人サイトの求人トップ画像（メイン画像）評価AIです。
求職者（女の子）が一覧で最初に見る1枚として適切かを判定してください。

評価観点:
1. 求人・店舗と関係があるか（無関係な物体・ジョーク画像・戦車・風景のみ等は不可）
2. 店内の雰囲気が伝わるか
3. 女の子が働くイメージを持ちやすいか
4. 求職者に安心感を与えられるか
5. 暗すぎる・見づらい・ぼやけていないか
6. 一覧で店舗へ興味を持てる訴求力があるか

quality:
- good: 店舗・求人として適切で訴求力がある
- weak: 店舗関連だが暗い・雰囲気不足・訴求力が弱い
- poor: 店舗と無関係、または求人画像として不適切／著しく訴求力がない

JSONのみ返す:
{
  "quality": "good" | "weak" | "poor",
  "unrelated_to_shop": boolean,
  "summary_ja": "画像の内容を日本語で1文",
  "issues_ja": ["問題点を短く", "..."]
}`;

function missingAssessment(): MainImageAssessment {
  return {
    quality: "missing",
    summary: "メイン画像未登録",
    needsHighPriorityFix: true,
    issue: "トップ画像（メイン画像）が未登録です。",
    action:
      "トップ画像を、店内の雰囲気や働くイメージが伝わる写真へ設定してください。一覧で最初に目に入る1枚として、明るく店内が分かる写真を推奨します。",
    expectedEffect: "求人詳細の閲覧率・応募率の改善",
    reason: "一覧1枚目となるメイン画像が未登録のため",
  };
}

function poorUnrelatedAssessment(summary: string): MainImageAssessment {
  const summaryText = summary.trim() || "店舗と関係の薄い画像";
  return {
    quality: "poor",
    summary: summaryText,
    needsHighPriorityFix: true,
    issue: `トップ画像が求人・店舗との関連性が低い状態です（${summaryText}）。`,
    action:
      "トップ画像を、店内の雰囲気や働くイメージが伝わる写真へ変更してください。現在の画像は店舗・求人との関連性が低く、求職者が仕事内容やお店の雰囲気を判断しにくい状態です。",
    expectedEffect: "求人詳細の閲覧率・応募率の改善",
    reason: "メイン画像が店舗・求人と無関係、または求人訴求として不適切なため",
  };
}

function weakAssessment(summary: string, issues: string[]): MainImageAssessment {
  const issueText =
    issues.filter(Boolean).slice(0, 2).join("・") ||
    "店内雰囲気・安心感の伝わり方が弱い";
  return {
    quality: "weak",
    summary: summary.trim() || "訴求力が弱いメイン画像",
    needsHighPriorityFix: true,
    issue: `トップ画像の訴求力が不足しています（${issueText}）。`,
    action:
      "トップ画像を、明るく店内の雰囲気や働くイメージが伝わる写真へ差し替えてください。カウンター・内装・席の様子など、求職者がお店を想像しやすい1枚を選んでください。",
    expectedEffect: "求人詳細の閲覧率・応募率の改善",
    reason: "メイン画像はあるが、店内雰囲気・安心感・一覧での訴求力が弱いため",
  };
}

function goodAssessment(summary: string): MainImageAssessment {
  return {
    quality: "good",
    summary: summary.trim() || "店舗の雰囲気が伝わるメイン画像",
    needsHighPriorityFix: false,
    issue: "",
    action: "",
    expectedEffect: "",
    reason: "",
  };
}

/** OpenAI 未設定時・失敗時。ゼロ応募など強い課題がある場合は見直しを推奨。 */
function fallbackPresentAssessment(opts: {
  forceReview: boolean;
}): MainImageAssessment {
  if (!opts.forceReview) {
    return goodAssessment("メイン画像あり（自動評価スキップ）");
  }
  return {
    quality: "weak",
    summary: "メイン画像あり（内容の自動判定不可）",
    needsHighPriorityFix: true,
    issue:
      "詳細閲覧はある一方で応募につながっていません。トップ画像の訴求力を見直す必要があります。",
    action:
      "トップ画像を、店内の雰囲気や働くイメージが伝わる写真へ変更してください。一覧で最初に見たときに店舗へ興味を持てる、明るく安心感のある写真を選んでください。",
    expectedEffect: "求人詳細の閲覧率・応募率の改善",
    reason: "詳細は見られているが応募が伸びておらず、トップ画像の見直し余地があるため",
  };
}

function normalizeImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

async function evaluateWithOpenAi(opts: {
  imageUrl: string;
  jobType?: string | null;
  shopTitle?: string | null;
}): Promise<MainImageAssessment> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey });
  const contextBits = [
    opts.shopTitle ? `店舗名: ${opts.shopTitle}` : null,
    opts.jobType ? `業種: ${opts.jobType}` : null,
  ].filter(Boolean);

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 280,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `この求人トップ画像を評価してください。\n${contextBits.join("\n") || "店舗情報: 不明"}`,
          },
          {
            type: "image_url",
            image_url: { url: opts.imageUrl, detail: "low" },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(raw) as {
    quality?: unknown;
    unrelated_to_shop?: unknown;
    summary_ja?: unknown;
    issues_ja?: unknown;
  };

  const qualityRaw = String(parsed.quality ?? "").toLowerCase();
  const quality: MainImageQuality =
    qualityRaw === "poor" || qualityRaw === "weak" || qualityRaw === "good"
      ? qualityRaw
      : parsed.unrelated_to_shop
        ? "poor"
        : "weak";

  const summary =
    typeof parsed.summary_ja === "string" ? parsed.summary_ja.trim() : "";
  const issues = Array.isArray(parsed.issues_ja)
    ? parsed.issues_ja.map((item) => String(item)).filter(Boolean)
    : [];

  if (quality === "poor" || parsed.unrelated_to_shop === true) {
    return poorUnrelatedAssessment(summary);
  }
  if (quality === "weak") {
    return weakAssessment(summary, issues);
  }
  return goodAssessment(summary);
}

/**
 * 求人トップ画像（メイン画像）を評価する。
 * OpenAI Vision が使える場合は内容を判定し、不可時はヒューリスティックにフォールバックする。
 */
export async function evaluateShopMainImage(input: {
  imageUrl?: string | null;
  jobType?: string | null;
  shopTitle?: string | null;
  /** 詳細はあるが応募0など、画像見直しを強めに勧めるべき状況 */
  forceReviewWhenUnevaluable?: boolean;
}): Promise<MainImageAssessment> {
  const imageUrl = normalizeImageUrl(String(input.imageUrl ?? ""));
  if (!imageUrl) return missingAssessment();

  if (!isOpenAiConfigured()) {
    return fallbackPresentAssessment({
      forceReview: Boolean(input.forceReviewWhenUnevaluable),
    });
  }

  try {
    return await evaluateWithOpenAi({
      imageUrl,
      jobType: input.jobType,
      shopTitle: input.shopTitle,
    });
  } catch (error) {
    console.error("[shop-main-image-ai] OpenAI failed, using fallback", error);
    return fallbackPresentAssessment({
      forceReview: Boolean(input.forceReviewWhenUnevaluable),
    });
  }
}
