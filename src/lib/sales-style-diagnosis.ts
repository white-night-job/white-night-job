import type { JobType } from "@/types/job";

export const SALES_STYLE_TYPES = [
  "entertainer",
  "healer",
  "romance",
  "elegant",
  "natural",
] as const;

export type SalesStyleType = (typeof SALES_STYLE_TYPES)[number];

export type SalesStyleProfile = {
  type: SalesStyleType;
  name: string;
  catchCopy: string;
  feature: string;
  services: string[];
  weaknesses: string[];
  workStyle: string;
  jobTypes: Array<{ label: string; value: JobType }>;
};

export const SALES_STYLE_PROFILES: Record<SalesStyleType, SalesStyleProfile> = {
  entertainer: {
    type: "entertainer",
    name: "盛り上げ・エンタメ型",
    catchCopy: "その場をパッと明るくする、みんなのムードメーカー",
    feature:
      "明るさ・リアクション・テンポの良い会話が強み。場の空気を動かしやすく、初対面でも印象を残しやすいタイプ。",
    services: ["盛り上げ役", "団体客対応", "ノリの良い会話", "テンポ重視の接客"],
    weaknesses: [
      "静かな相手への接客",
      "テンションを維持しすぎて疲れる",
      "相手の話を聞く時間が短くなりやすい",
    ],
    workStyle: "自分の明るさを活かせる、にぎやかな店舗やフリー客が多い環境。",
    jobTypes: [
      { label: "ガールズバー", value: "ガールズバー" },
      { label: "コンカフェ", value: "コンカフェ" },
      { label: "ニュークラブ", value: "ニュークラ" },
    ],
  },
  healer: {
    type: "healer",
    name: "聞き上手・癒し型",
    catchCopy: "そばにいるだけで安心される、癒しの存在",
    feature:
      "相手の話を聞いて安心感を与えるのが得意。無理に盛り上げなくても、居心地の良さでリピートにつなげやすいタイプ。",
    services: ["1対1の会話", "相談を聞く", "常連づくり", "落ち着いた接客"],
    weaknesses: ["強引な営業", "大人数での盛り上げ", "短時間で強い印象を残す接客"],
    workStyle: "常連客を少しずつ増やし、長く通ってもらうスタイル。",
    jobTypes: [
      { label: "スナック", value: "スナック" },
      { label: "ラウンジ", value: "ラウンジ" },
      { label: "ガールズバー", value: "ガールズバー" },
    ],
  },
  romance: {
    type: "romance",
    name: "距離感近め・恋人営業型",
    catchCopy: "距離を縮めて、特別な関係を築ける人",
    feature:
      "マメな連絡や距離の縮め方が得意。お客様との関係性を深めて、指名・リピートにつなげやすいタイプ。",
    services: ["LINE営業", "指名づくり", "リピート促進", "距離感の近い接客"],
    weaknesses: ["距離を縮めすぎる", "連絡頻度が負担になる", "相手に期待を持たせすぎる"],
    workStyle: "固定客や指名制度があり、継続的な関係づくりが売上につながる環境。",
    jobTypes: [
      { label: "ニュークラブ", value: "ニュークラ" },
      { label: "ラウンジ", value: "ラウンジ" },
      { label: "ガールズバー", value: "ガールズバー" },
    ],
  },
  elegant: {
    type: "elegant",
    name: "上品・落ち着き型",
    catchCopy: "品の良さと落ち着きで、信頼される大人の接客",
    feature:
      "丁寧な言葉遣いや落ち着いた雰囲気が強み。ガツガツした営業をしなくても、品の良さや安心感で評価されやすいタイプ。",
    services: ["落ち着いた会話", "丁寧な接客", "年上のお客様対応", "高単価客への接客"],
    weaknesses: ["大騒ぎする接客", "強い営業", "テンション重視の店舗"],
    workStyle: "接客の丁寧さや雰囲気を評価してもらえる店舗。",
    jobTypes: [
      { label: "ラウンジ", value: "ラウンジ" },
      { label: "ニュークラブ", value: "ニュークラ" },
      { label: "スナック", value: "スナック" },
    ],
  },
  natural: {
    type: "natural",
    name: "マイペース・自然体型",
    catchCopy: "飾らない自分らしさで、自然と好かれる人",
    feature:
      "無理にキャラを作らず、自分らしく接客できるタイプ。営業感を出さずに親しみやすさで関係を作りやすい。",
    services: [
      "自然体の会話",
      "友達感覚の接客",
      "自分のペースでの接客",
      "無理をしない常連づくり",
    ],
    weaknesses: ["厳しい売上ノルマ", "頻繁なLINE営業", "強い競争環境"],
    workStyle: "ノルマが少なく、自由度が高く、自分のペースで働ける店舗。",
    jobTypes: [
      { label: "ガールズバー", value: "ガールズバー" },
      { label: "コンカフェ", value: "コンカフェ" },
      { label: "スナック", value: "スナック" },
    ],
  },
};

type Points = Partial<Record<SalesStyleType, number>>;

export type SalesStyleQuestion = {
  id: string;
  title: string;
  options: Array<{ value: string; label: string; points: Points }>;
};

const A = "entertainer";
const B = "healer";
const C = "romance";
const D = "elegant";
const E = "natural";

export const SALES_STYLE_QUESTIONS: SalesStyleQuestion[] = [
  {
    id: "q1",
    title: "初対面の人と話す時は？",
    options: [
      { value: "1", label: "自分からどんどん話題を出せる", points: { [A]: 3, [C]: 1 } },
      { value: "2", label: "相手の話を聞きながら広げるのが得意", points: { [B]: 3, [D]: 1 } },
      { value: "3", label: "相手によって話し方を変える", points: { [C]: 2, [B]: 1, [D]: 1 } },
      { value: "4", label: "少し緊張するので、慣れてから話せる", points: { [E]: 3, [B]: 1 } },
    ],
  },
  {
    id: "q2",
    title: "お客様との距離感は？",
    options: [
      { value: "1", label: "すぐ仲良くなりたい", points: { [C]: 3, [A]: 1 } },
      { value: "2", label: "少しずつ距離を縮めたい", points: { [B]: 2, [C]: 1, [E]: 1 } },
      { value: "3", label: "丁寧な距離感を保ちたい", points: { [D]: 3, [B]: 1 } },
      { value: "4", label: "無理せず自然体でいたい", points: { [E]: 3, [B]: 1 } },
    ],
  },
  {
    id: "q3",
    title: "LINEの返信は？",
    options: [
      { value: "1", label: "かなりマメ", points: { [C]: 3, [A]: 1 } },
      { value: "2", label: "必要な時は早く返す", points: { [B]: 2, [D]: 1 } },
      { value: "3", label: "自分のペースで返したい", points: { [E]: 3 } },
      { value: "4", label: "LINE営業は少し苦手", points: { [E]: 2, [D]: 1 } },
    ],
  },
  {
    id: "q4",
    title: "お客様を盛り上げるのは？",
    options: [
      { value: "1", label: "得意", points: { [A]: 3 } },
      { value: "2", label: "普通", points: { [A]: 1, [B]: 1, [E]: 1 } },
      { value: "3", label: "1対1なら得意", points: { [B]: 2, [C]: 2 } },
      { value: "4", label: "落ち着いた会話の方が好き", points: { [D]: 3, [B]: 1 } },
    ],
  },
  {
    id: "q5",
    title: "自分から「また来てね」と言うのは？",
    options: [
      { value: "1", label: "全然平気", points: { [C]: 3, [A]: 1 } },
      { value: "2", label: "仲良くなれば言える", points: { [B]: 2, [C]: 1 } },
      { value: "3", label: "少し苦手", points: { [E]: 2, [D]: 1 } },
      { value: "4", label: "できれば自然にまた来てほしい", points: { [E]: 3, [B]: 1 } },
    ],
  },
  {
    id: "q6",
    title: "大人数と1対1なら？",
    options: [
      { value: "1", label: "大人数の方が得意", points: { [A]: 3 } },
      { value: "2", label: "どちらも平気", points: { [A]: 1, [B]: 1, [C]: 1, [D]: 1 } },
      { value: "3", label: "1対1の方が得意", points: { [B]: 2, [C]: 2 } },
      { value: "4", label: "少人数が好き", points: { [D]: 2, [E]: 2 } },
    ],
  },
  {
    id: "q7",
    title: "自分の強みに近いのは？",
    options: [
      { value: "1", label: "明るさ・ノリ", points: { [A]: 3 } },
      { value: "2", label: "聞き上手", points: { [B]: 3 } },
      { value: "3", label: "上品さ・落ち着き", points: { [D]: 3 } },
      { value: "4", label: "親しみやすさ", points: { [E]: 2, [C]: 2 } },
    ],
  },
  {
    id: "q8",
    title: "売上目標についてどう思う？",
    options: [
      { value: "1", label: "目標がある方が燃える", points: { [A]: 2, [C]: 2 } },
      { value: "2", label: "ある程度なら頑張れる", points: { [B]: 1, [C]: 1, [D]: 1 } },
      { value: "3", label: "プレッシャーは少し苦手", points: { [E]: 2, [B]: 1 } },
      { value: "4", label: "数字より楽しく働きたい", points: { [E]: 3 } },
    ],
  },
  {
    id: "q9",
    title: "お客様から悩み相談されたら？",
    options: [
      { value: "1", label: "元気づける", points: { [A]: 2, [B]: 1 } },
      { value: "2", label: "とことん話を聞く", points: { [B]: 3 } },
      { value: "3", label: "冷静にアドバイスする", points: { [D]: 3 } },
      { value: "4", label: "共感しながら一緒に話す", points: { [B]: 2, [C]: 1, [E]: 1 } },
    ],
  },
  {
    id: "q10",
    title: "お酒を飲まずに接客するなら？",
    options: [
      { value: "1", label: "テンションで盛り上げられる", points: { [A]: 3 } },
      { value: "2", label: "会話だけでも十分いける", points: { [B]: 2, [C]: 1 } },
      { value: "3", label: "落ち着いた接客なら得意", points: { [D]: 3 } },
      { value: "4", label: "少し不安", points: { [E]: 2, [B]: 1 } },
    ],
  },
  {
    id: "q11",
    title: "お客様から好意を持たれた時は？",
    options: [
      { value: "1", label: "距離を縮めるのが得意", points: { [C]: 3 } },
      { value: "2", label: "ほどよく対応できる", points: { [B]: 1, [C]: 1, [D]: 1 } },
      { value: "3", label: "一線を引いて接したい", points: { [D]: 3 } },
      { value: "4", label: "普段通り自然に接したい", points: { [E]: 3 } },
    ],
  },
  {
    id: "q12",
    title: "理想の働き方は？",
    options: [
      { value: "1", label: "しっかり稼ぎたい", points: { [A]: 2, [C]: 2 } },
      { value: "2", label: "常連さんを増やしたい", points: { [B]: 2, [C]: 2 } },
      { value: "3", label: "無理なく上品に働きたい", points: { [D]: 3 } },
      { value: "4", label: "自分らしく楽しく働きたい", points: { [E]: 3 } },
    ],
  },
];

/** 質問ID → 選択肢value */
export type SalesStyleAnswers = Record<string, string>;

export type SalesStyleResult = {
  mainType: SalesStyleType;
  /** 1位同点、または1位との差が2点以内のとき */
  subType: SalesStyleType | null;
  diagnosedAt: string;
};

export type SavedSalesStyleResult = {
  id?: string;
  diagnosedAt: string;
  mainType: SalesStyleType;
  subType: SalesStyleType | null;
};

const SUB_TYPE_MAX_GAP = 2;

export function isSalesStyleType(value: unknown): value is SalesStyleType {
  return (
    typeof value === "string" &&
    (SALES_STYLE_TYPES as readonly string[]).includes(value)
  );
}

/** 全問に有効な回答がある場合のみ、質問ID順に正規化した回答を返す */
export function normalizeSalesStyleAnswers(raw: unknown): SalesStyleAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const normalized: SalesStyleAnswers = {};
  for (const question of SALES_STYLE_QUESTIONS) {
    const value = source[question.id];
    if (
      typeof value !== "string" ||
      !question.options.some((option) => option.value === value)
    ) {
      return null;
    }
    normalized[question.id] = value;
  }
  return normalized;
}

/**
 * 合計点が最も高いタイプをメインにする。
 * 同点時はより多くの設問で3点を得たタイプをメインにし、もう一方は必ずサブタイプとして表示する。
 */
export function calculateSalesStyleResult(
  answers: SalesStyleAnswers,
): SalesStyleResult | null {
  const normalized = normalizeSalesStyleAnswers(answers);
  if (!normalized) return null;

  const totals = new Map<SalesStyleType, number>();
  const strongHits = new Map<SalesStyleType, number>();
  for (const type of SALES_STYLE_TYPES) {
    totals.set(type, 0);
    strongHits.set(type, 0);
  }

  for (const question of SALES_STYLE_QUESTIONS) {
    const option = question.options.find(
      (item) => item.value === normalized[question.id],
    );
    if (!option) continue;
    for (const type of SALES_STYLE_TYPES) {
      const points = option.points[type] ?? 0;
      totals.set(type, (totals.get(type) ?? 0) + points);
      if (points >= 3) strongHits.set(type, (strongHits.get(type) ?? 0) + 1);
    }
  }

  const ranked = [...SALES_STYLE_TYPES].sort(
    (a, b) =>
      (totals.get(b) ?? 0) - (totals.get(a) ?? 0) ||
      (strongHits.get(b) ?? 0) - (strongHits.get(a) ?? 0),
  );

  const [first, second] = ranked;
  const gap = (totals.get(first) ?? 0) - (totals.get(second) ?? 0);

  return {
    mainType: first,
    subType: gap <= SUB_TYPE_MAX_GAP ? second : null,
    diagnosedAt: new Date().toISOString(),
  };
}