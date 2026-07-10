import type { DiagnosisAnswers, DiagnosisJobType, DiagnosisQuestion } from "@/lib/job-type-diagnosis-types";

/** 管理画面から差し替え可能な診断設定（質問・スコア・表示文言） */
export const JOB_TYPE_DIAGNOSIS_CONFIG = {
  questions: [
    {
      key: "purpose",
      title: "働く目的は？",
      options: [
        { label: "楽しく働きたい", value: "fun" },
        { label: "しっかり稼ぎたい", value: "earn" },
        { label: "常連さんと長く付き合いたい", value: "regular" },
        { label: "接客スキルを身につけたい", value: "skill" },
      ],
    },
    {
      key: "alcohol",
      title: "お酒は？",
      options: [
        { label: "飲める", value: "yes" },
        { label: "少しだけ", value: "little" },
        { label: "飲めない", value: "no" },
      ],
    },
    {
      key: "serviceStyle",
      title: "どんな接客が好き？",
      options: [
        { label: "友達みたいに話したい", value: "friendly" },
        { label: "落ち着いて接客したい", value: "calm" },
        { label: "ワイワイ盛り上がりたい", value: "lively" },
        { label: "丁寧なおもてなしが好き", value: "hospitality" },
      ],
    },
    {
      key: "workTime",
      title: "働きたい時間",
      options: [
        { label: "夕方", value: "evening" },
        { label: "夜", value: "night" },
        { label: "深夜", value: "late" },
      ],
    },
    {
      key: "customerType",
      title: "どんなお客様がいい？",
      options: [
        { label: "若い方", value: "young" },
        { label: "会社員", value: "office" },
        { label: "経営者", value: "executive" },
        { label: "常連さん", value: "regular" },
      ],
    },
    {
      key: "priority",
      title: "一番重視すること",
      options: [
        { label: "働きやすさ", value: "comfort" },
        { label: "時給", value: "salary" },
        { label: "未経験歓迎", value: "beginner" },
        { label: "客層", value: "clientele" },
        { label: "自由さ", value: "freedom" },
      ],
    },
  ] satisfies DiagnosisQuestion[],

  scoringRules: [
    { key: "purpose", value: "fun", weights: { コンカフェ: 4, ガールズバー: 3, スナック: 2 } },
    { key: "purpose", value: "earn", weights: { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 } },
    { key: "purpose", value: "regular", weights: { スナック: 5, ラウンジ: 2, ガールズバー: 2 } },
    { key: "purpose", value: "skill", weights: { ラウンジ: 4, "キャバクラ（ニュークラブ）": 3, クラブ: 3 } },
    { key: "alcohol", value: "yes", weights: { クラブ: 3, ラウンジ: 3, "キャバクラ（ニュークラブ）": 3 } },
    { key: "alcohol", value: "little", weights: { ガールズバー: 3, スナック: 3, ラウンジ: 2 } },
    { key: "alcohol", value: "no", weights: { コンカフェ: 4, ガールズバー: 3, スナック: 2 } },
    { key: "serviceStyle", value: "friendly", weights: { ガールズバー: 4, コンカフェ: 4, スナック: 2 } },
    { key: "serviceStyle", value: "calm", weights: { ラウンジ: 4, スナック: 4, クラブ: 2 } },
    { key: "serviceStyle", value: "lively", weights: { ガールズバー: 4, コンカフェ: 3, クラブ: 2 } },
    { key: "serviceStyle", value: "hospitality", weights: { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 } },
    { key: "workTime", value: "evening", weights: { スナック: 4, コンカフェ: 3, ガールズバー: 2 } },
    { key: "workTime", value: "night", weights: { ガールズバー: 4, ラウンジ: 3, コンカフェ: 2 } },
    { key: "workTime", value: "late", weights: { クラブ: 4, "キャバクラ（ニュークラブ）": 4, ラウンジ: 2 } },
    { key: "customerType", value: "young", weights: { ガールズバー: 4, コンカフェ: 4 } },
    { key: "customerType", value: "office", weights: { ラウンジ: 4, ガールズバー: 3, スナック: 2 } },
    { key: "customerType", value: "executive", weights: { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 } },
    { key: "customerType", value: "regular", weights: { スナック: 5, ラウンジ: 2 } },
    { key: "priority", value: "comfort", weights: { スナック: 4, コンカフェ: 3, ガールズバー: 2 } },
    { key: "priority", value: "salary", weights: { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 } },
    { key: "priority", value: "beginner", weights: { ガールズバー: 4, コンカフェ: 4, スナック: 3 } },
    { key: "priority", value: "clientele", weights: { ラウンジ: 4, "キャバクラ（ニュークラブ）": 3, クラブ: 3 } },
    { key: "priority", value: "freedom", weights: { ガールズバー: 4, コンカフェ: 3, スナック: 2 } },
  ] as Array<{
    key: keyof DiagnosisAnswers;
    value: string;
    weights: Partial<Record<DiagnosisJobType, number>>;
  }>,

  jobProfiles: {
    コンカフェ: {
      reason: "世界観を楽しみながら、フレンドリーな接客がしやすいタイプです。",
      points: ["お話好きな方に向いています", "お酒が苦手でも働きやすい", "未経験でも始めやすい"],
      merits: ["テーマ性があって楽しい", "接客のハードルが比較的低め", "シフトの自由度が高いことも"],
    },
    ガールズバー: {
      reason: "カジュアルな雰囲気の中で、会話を楽しみながら働きたい方に合います。",
      points: ["友達感覚の接客が得意", "夜の時間帯に働きたい", "未経験歓迎の店舗が多い"],
      merits: ["始めやすい職種のひとつ", "時給と働きやすさのバランスが良い", "接客経験を積みやすい"],
    },
    スナック: {
      reason: "常連さんとの距離が近く、落ち着いた雰囲気で長く働きたい方に向いています。",
      points: ["人との距離感が近い接客が好き", "夕方〜夜の時間帯が合う", "働きやすさを重視したい"],
      merits: ["アットホームな環境", "常連づくりのやりがい", "無理の少ないシフトも多い"],
    },
    ラウンジ: {
      reason: "落ち着いた接客と上品な雰囲気で、しっかりした接客スキルを身につけたい方に合います。",
      points: ["丁寧な接客が得意", "客層や雰囲気を重視", "安定感のある働き方がしたい"],
      merits: ["接客スキルが身につく", "落ち着いた店内が多い", "時給面も期待できる"],
    },
    クラブ: {
      reason: "しっかり稼ぎたい方や、ハイクラスな接客に挑戦したい方に向いています。",
      points: ["時給を重視", "深夜帯も問題ない", "お酒に強みがある"],
      merits: ["高単価を狙いやすい", "フォーマルな接客経験になる", "スキルアップの幅が広い"],
    },
    "キャバクラ（ニュークラブ）": {
      reason: "しっかり稼ぎたい方や、丁寧なホスピタリティを磨きたい方に最適です。",
      points: ["時給を最重視", "経営者・会社員との接客に興味", "身だしなみに自信がある"],
      merits: ["高収入を目指しやすい", "接客スキルが伸びやすい", "未経験歓迎の店舗も多い"],
    },
  } satisfies Record<
    DiagnosisJobType,
    { reason: string; points: string[]; merits: string[] }
  >,

  /** 実データ集計までのダミー応募率（第1位職種への応募率%） */
  socialProofApplyRates: {
    コンカフェ: 58,
    ガールズバー: 67,
    スナック: 52,
    ラウンジ: 61,
    クラブ: 49,
    "キャバクラ（ニュークラブ）": 55,
  } satisfies Record<DiagnosisJobType, number>,

  shopReasonTemplates: [
    "診断結果の第1位職種にマッチしています",
    "未経験でも始めやすい雰囲気のお店です",
    "優良認定店舗で安心して応募できます",
    "あなたの重視ポイントに合う条件が揃っています",
  ],
} as const;
