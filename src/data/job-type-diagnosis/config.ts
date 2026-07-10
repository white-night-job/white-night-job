import type { DiagnosisAnswers, DiagnosisJobType, DiagnosisQuestion } from "@/lib/job-type-diagnosis-types";

/** 管理画面から差し替え可能な診断設定（質問・スコア・表示文言） */
export const JOB_TYPE_DIAGNOSIS_CONFIG = {
  questions: [
    {
      key: "priority",
      title: "夜職で一番重視することは？",
      options: [
        { label: "とにかく稼ぎたい", value: "earn_money" },
        { label: "楽しく働きたい", value: "fun" },
        { label: "働きやすさ", value: "comfort" },
        { label: "客層", value: "clientele" },
        { label: "自由なシフト", value: "freedom" },
      ],
    },
    {
      key: "experience",
      title: "夜職の経験期間はどのくらいですか？",
      options: [
        { label: "完全未経験", value: "none" },
        { label: "1〜6か月", value: "short" },
        { label: "6か月〜2年", value: "medium" },
        { label: "2〜4年", value: "long" },
        { label: "4年以上", value: "veteran" },
      ],
    },
    {
      key: "age",
      title: "あなたの年齢は？",
      options: [
        { label: "18〜20歳", value: "age_18_20" },
        { label: "21〜24歳", value: "age_21_24" },
        { label: "25〜29歳", value: "age_25_29" },
        { label: "30歳以上", value: "age_30_plus" },
      ],
    },
    {
      key: "alcohol",
      title: "お酒は飲めますか？",
      options: [
        { label: "飲める", value: "yes" },
        { label: "少しだけ飲める", value: "little" },
        { label: "飲めない", value: "no" },
      ],
    },
    {
      key: "serviceStyle",
      title: "どんな接客スタイルが好きですか？",
      options: [
        { label: "友達みたいに話したい", value: "friendly" },
        { label: "ワイワイ盛り上げたい", value: "lively" },
        { label: "落ち着いて会話したい", value: "calm" },
        { label: "丁寧なおもてなしをしたい", value: "hospitality" },
      ],
    },
    {
      key: "customerType",
      title: "どんなお客様が多いお店で働きたいですか？",
      options: [
        { label: "20〜30代中心", value: "young" },
        { label: "会社員中心", value: "office" },
        { label: "経営者・役員中心", value: "executive" },
        { label: "常連さんが多い", value: "regular" },
      ],
    },
    {
      key: "goal",
      title: "夜職を始める目的は？",
      options: [
        { label: "お小遣い稼ぎ", value: "pocket_money" },
        { label: "生活費を稼ぎたい", value: "living" },
        { label: "とにかく高収入を目指したい", value: "high_income" },
        { label: "接客スキルを身につけたい", value: "skill" },
      ],
    },
    {
      key: "atmosphere",
      title: "どんな雰囲気のお店が好きですか？",
      options: [
        { label: "可愛い世界観", value: "cute" },
        { label: "明るく賑やか", value: "bright" },
        { label: "落ち着いた空間", value: "calm_space" },
        { label: "高級感のある空間", value: "luxury" },
      ],
    },
    {
      key: "schedule",
      title: "希望する出勤ペースは？",
      options: [
        { label: "週1〜2日", value: "week1_2" },
        { label: "週3〜4日", value: "week3_4" },
        { label: "週5日以上", value: "week5_plus" },
        { label: "まだ決めていない", value: "undecided" },
      ],
    },
    {
      key: "outfit",
      title: "どんな服装で働きたいですか？",
      options: [
        { label: "制服", value: "uniform" },
        { label: "私服", value: "casual" },
        { label: "ドレス", value: "dress" },
        { label: "綺麗めワンピース", value: "onepiece" },
      ],
    },
    {
      key: "personality",
      title: "あなたの性格に一番近いものは？",
      options: [
        { label: "明るく話すのが好き", value: "outgoing" },
        { label: "人見知りだけど慣れると話せる", value: "shy_warm" },
        { label: "聞き上手", value: "good_listener" },
        { label: "おしゃれが好き", value: "fashionable" },
        { label: "負けず嫌い", value: "competitive" },
      ],
    },
  ] satisfies DiagnosisQuestion[],

  scoringRules: [
    // Q1 重視すること
    { key: "priority", value: "earn_money", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 3 } },
    { key: "priority", value: "fun", weights: { コンカフェ: 5, ガールズバー: 4, スナック: 2 } },
    { key: "priority", value: "comfort", weights: { スナック: 5, コンカフェ: 4, ガールズバー: 3 } },
    { key: "priority", value: "clientele", weights: { ラウンジ: 5, "キャバクラ（ニュークラブ）": 4, クラブ: 3 } },
    { key: "priority", value: "freedom", weights: { ガールズバー: 5, コンカフェ: 4, スナック: 3 } },
    // Q2 経験期間
    { key: "experience", value: "none", weights: { ガールズバー: 5, コンカフェ: 5, スナック: 3 } },
    { key: "experience", value: "short", weights: { ガールズバー: 4, コンカフェ: 4, スナック: 3 } },
    { key: "experience", value: "medium", weights: { ラウンジ: 4, ガールズバー: 3, スナック: 3 } },
    { key: "experience", value: "long", weights: { ラウンジ: 4, "キャバクラ（ニュークラブ）": 4, クラブ: 3 } },
    { key: "experience", value: "veteran", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 4 } },
    // Q3 年齢
    { key: "age", value: "age_18_20", weights: { コンカフェ: 5, ガールズバー: 4 } },
    { key: "age", value: "age_21_24", weights: { ガールズバー: 5, コンカフェ: 4, "キャバクラ（ニュークラブ）": 3 } },
    { key: "age", value: "age_25_29", weights: { ラウンジ: 5, "キャバクラ（ニュークラブ）": 4, ガールズバー: 3 } },
    { key: "age", value: "age_30_plus", weights: { スナック: 5, ラウンジ: 4, "キャバクラ（ニュークラブ）": 3 } },
    // Q4 お酒
    { key: "alcohol", value: "yes", weights: { クラブ: 4, "キャバクラ（ニュークラブ）": 4, ラウンジ: 3 } },
    { key: "alcohol", value: "little", weights: { ガールズバー: 4, スナック: 4, ラウンジ: 3 } },
    { key: "alcohol", value: "no", weights: { コンカフェ: 5, ガールズバー: 3, スナック: 3 } },
    // Q5 接客スタイル
    { key: "serviceStyle", value: "friendly", weights: { ガールズバー: 5, コンカフェ: 4, スナック: 3 } },
    { key: "serviceStyle", value: "lively", weights: { コンカフェ: 5, ガールズバー: 4, クラブ: 3 } },
    { key: "serviceStyle", value: "calm", weights: { スナック: 5, ラウンジ: 4, クラブ: 2 } },
    { key: "serviceStyle", value: "hospitality", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 4, ラウンジ: 4 } },
    // Q6 お客様層
    { key: "customerType", value: "young", weights: { ガールズバー: 5, コンカフェ: 5 } },
    { key: "customerType", value: "office", weights: { ラウンジ: 5, ガールズバー: 3, スナック: 3 } },
    { key: "customerType", value: "executive", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 3 } },
    { key: "customerType", value: "regular", weights: { スナック: 5, ラウンジ: 3 } },
    // Q7 目的
    { key: "goal", value: "pocket_money", weights: { コンカフェ: 4, ガールズバー: 4, スナック: 3 } },
    { key: "goal", value: "living", weights: { ガールズバー: 4, ラウンジ: 4, スナック: 4 } },
    { key: "goal", value: "high_income", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 3 } },
    { key: "goal", value: "skill", weights: { ラウンジ: 5, "キャバクラ（ニュークラブ）": 4, クラブ: 4 } },
    // Q8 雰囲気
    { key: "atmosphere", value: "cute", weights: { コンカフェ: 5, ガールズバー: 3 } },
    { key: "atmosphere", value: "bright", weights: { ガールズバー: 5, コンカフェ: 4 } },
    { key: "atmosphere", value: "calm_space", weights: { スナック: 5, ラウンジ: 4 } },
    { key: "atmosphere", value: "luxury", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 4 } },
    // Q9 出勤ペース
    { key: "schedule", value: "week1_2", weights: { ガールズバー: 4, コンカフェ: 4, スナック: 4 } },
    { key: "schedule", value: "week3_4", weights: { ラウンジ: 4, ガールズバー: 3, "キャバクラ（ニュークラブ）": 3 } },
    { key: "schedule", value: "week5_plus", weights: { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 } },
    { key: "schedule", value: "undecided", weights: { コンカフェ: 4, ガールズバー: 4, スナック: 3 } },
    // Q10 服装
    { key: "outfit", value: "uniform", weights: { コンカフェ: 5, ガールズバー: 3 } },
    { key: "outfit", value: "casual", weights: { ガールズバー: 5, スナック: 4 } },
    { key: "outfit", value: "dress", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 5, ラウンジ: 4 } },
    { key: "outfit", value: "onepiece", weights: { ラウンジ: 5, "キャバクラ（ニュークラブ）": 4, スナック: 3 } },
    // Q11 性格
    { key: "personality", value: "outgoing", weights: { ガールズバー: 5, コンカフェ: 4 } },
    { key: "personality", value: "shy_warm", weights: { スナック: 5, コンカフェ: 4, ガールズバー: 3 } },
    { key: "personality", value: "good_listener", weights: { スナック: 5, ラウンジ: 4 } },
    { key: "personality", value: "fashionable", weights: { "キャバクラ（ニュークラブ）": 5, クラブ: 4, ラウンジ: 4 } },
    { key: "personality", value: "competitive", weights: { クラブ: 5, "キャバクラ（ニュークラブ）": 4, ラウンジ: 3 } },
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
      cautions: ["世界観に合わせた接客が求められることも", "ピーク時間は混雑しやすい", "店ごとにルールが異なるので事前確認が大切"],
    },
    ガールズバー: {
      reason: "カジュアルな雰囲気の中で、会話を楽しみながら働きたい方に合います。",
      points: ["友達感覚の接客が得意", "夜の時間帯に働きたい", "未経験歓迎の店舗が多い"],
      merits: ["始めやすい職種のひとつ", "時給と働きやすさのバランスが良い", "接客経験を積みやすい"],
      cautions: ["深夜帯の勤務になることも", "会話量が多い日もある", "店舗によって雰囲気の差が大きい"],
    },
    スナック: {
      reason: "常連さんとの距離が近く、落ち着いた雰囲気で長く働きたい方に向いています。",
      points: ["人との距離感が近い接客が好き", "夕方〜夜の時間帯が合う", "働きやすさを重視したい"],
      merits: ["アットホームな環境", "常連づくりのやりがい", "無理の少ないシフトも多い"],
      cautions: ["常連さんとの関係づくりに時間がかかることも", "時給は店舗によって差がある", "ママ・スタッフとの相性も大切"],
    },
    ラウンジ: {
      reason: "落ち着いた接客と上品な雰囲気で、しっかりした接客スキルを身につけたい方に合います。",
      points: ["丁寧な接客が得意", "客層や雰囲気を重視", "安定感のある働き方がしたい"],
      merits: ["接客スキルが身につく", "落ち着いた店内が多い", "時給面も期待できる"],
      cautions: ["マナーや身だしなみの基準が高めの店も", "お酒の知識があると安心", "落ち着いた接客が求められる"],
    },
    クラブ: {
      reason: "しっかり稼ぎたい方や、ハイクラスな接客に挑戦したい方に向いています。",
      points: ["時給を重視", "深夜帯も問題ない", "お酒に強みがある"],
      merits: ["高単価を狙いやすい", "フォーマルな接客経験になる", "スキルアップの幅が広い"],
      cautions: ["深夜勤務が中心になりやすい", "お酒の場面が多い", "体力面の負担も考えておきたい"],
    },
    "キャバクラ（ニュークラブ）": {
      reason: "しっかり稼ぎたい方や、丁寧なホスピタリティを磨きたい方に最適です。",
      points: ["時給を最重視", "経営者・会社員との接客に興味", "身だしなみに自信がある"],
      merits: ["高収入を目指しやすい", "接客スキルが伸びやすい", "未経験歓迎の店舗も多い"],
      cautions: ["身だしなみ・マナーの基準が高い店も", "営業ノルマがある店舗もある", "まずは体験入店で雰囲気確認がおすすめ"],
    },
  } satisfies Record<DiagnosisJobType, import("@/lib/job-type-diagnosis-types").DiagnosisJobProfile>,

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
