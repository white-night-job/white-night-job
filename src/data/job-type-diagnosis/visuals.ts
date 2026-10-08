import type { DiagnosisJobType } from "@/lib/job-type-diagnosis-types";

export type JobTypeVisualKey =
  | "girls-bar"
  | "concept-cafe"
  | "snack"
  | "lounge"
  | "club"
  | "new-club";

export type JobTypeSuitedIcon =
  | "message"
  | "sprout"
  | "calendar"
  | "smile"
  | "heart"
  | "sparkles"
  | "coffee"
  | "star"
  | "users"
  | "home"
  | "clock"
  | "ear"
  | "gem"
  | "briefcase"
  | "trending"
  | "shirt"
  | "wine"
  | "crown"
  | "moon";

export type JobTypeVisual = {
  key: JobTypeVisualKey;
  /**
   * 正式イラスト。未設定の間は JobTypeIllustration のSVGを表示する。
   * 差し替え時は public/images/job-types/ に置き、"/images/job-types/{key}.png" のように指定する。
   */
  imageSrc: string | null;
  theme: {
    /** 差し色（バッジ・アイコン・ゲージ） */
    accent: string;
    /** カードの淡い背景 */
    soft: string;
    /** 見出し・強調文字 */
    deep: string;
  };
  catchCopy: string;
  /** HEROに表示する装飾キーワード */
  keywords: string[];
  /** あなたに合う理由（2〜3行） */
  fitReason: string;
  suitedFor: Array<{ icon: JobTypeSuitedIcon; label: string }>;
  tips: string[];
  /** 一言アドバイス */
  advice: string;
};

/** 職種ごとのビジュアル・文言設定 */
export const JOB_TYPE_VISUALS: Record<DiagnosisJobType, JobTypeVisual> = {
  ガールズバー: {
    key: "girls-bar",
    imageSrc: null,
    theme: { accent: "#e0779f", soft: "#fdf0f5", deep: "#9c3d63" },
    catchCopy: "会話を楽しみながら、自分らしく働ける王道スタイル",
    keywords: ["カジュアル", "会話が主役", "未経験OK多め"],
    fitReason:
      "友達感覚の接客が得意で、堅すぎない雰囲気の中で自然に会話を楽しめるタイプです。カウンター越しの距離感なので、初めてでも落ち着いて話せます。",
    suitedFor: [
      { icon: "message", label: "人と話すのが好き" },
      { icon: "sprout", label: "未経験から始めたい" },
      { icon: "calendar", label: "自由度の高い働き方が好き" },
      { icon: "smile", label: "カジュアルな接客が好き" },
    ],
    tips: [
      "最初は聞き役に回って、相手の話に質問で返す",
      "ドリンクをいただいたら、笑顔でしっかりお礼を伝える",
      "常連さんの名前と好きな話題を覚えておく",
    ],
    advice:
      "最初から完璧に盛り上げようとせず、相手の話に興味を持って質問するだけでも十分です。",
  },
  コンカフェ: {
    key: "concept-cafe",
    imageSrc: null,
    theme: { accent: "#b58bd6", soft: "#f7f2fc", deep: "#6f4a93" },
    catchCopy: "好きな世界観を武器に、楽しく接客できるスタイル",
    keywords: ["世界観", "かわいい", "お酒なしOK多め"],
    fitReason:
      "可愛い世界観や「好き」を楽しみながら、フレンドリーに接客できるタイプです。お酒が苦手でも働きやすいお店が多いのも魅力です。",
    suitedFor: [
      { icon: "heart", label: "好きな世界観がある" },
      { icon: "sparkles", label: "かわいい衣装を着たい" },
      { icon: "coffee", label: "お酒は控えめにしたい" },
      { icon: "star", label: "イベントや企画が好き" },
    ],
    tips: [
      "お店のコンセプトに合わせた話し方を、少しずつ作っていく",
      "チェキやイベントの日は、お礼のひとことを添える",
      "SNS発信は、お店のルールに合わせて活用する",
    ],
    advice:
      "キャラを完璧に作り込まなくても大丈夫。あなたが楽しんでいる姿が、いちばんの魅力になります。",
  },
  スナック: {
    key: "snack",
    imageSrc: null,
    theme: { accent: "#9b3a50", soft: "#faf3ec", deep: "#6e2233" },
    catchCopy: "会話と居心地の良さで、常連さんと長く付き合える",
    keywords: ["アットホーム", "常連さん", "落ち着き"],
    fitReason:
      "落ち着いた空間で、一人ひとりとじっくり話すのが合っているタイプです。ママや常連さんとの距離が近く、長く働きやすい環境です。",
    suitedFor: [
      { icon: "users", label: "じっくり話すのが好き" },
      { icon: "home", label: "アットホームな職場がいい" },
      { icon: "clock", label: "夕方〜夜に働きたい" },
      { icon: "ear", label: "聞き上手と言われる" },
    ],
    tips: [
      "常連さんの好きなお酒や話題をメモしておく",
      "ママやスタッフとの連携を大切にする",
      "カラオケや会話で、自然に場をあたためる",
    ],
    advice:
      "無理に盛り上げなくても大丈夫。「また話したい」と思ってもらえる居心地の良さが一番の武器です。",
  },
  ラウンジ: {
    key: "lounge",
    imageSrc: null,
    theme: { accent: "#b8975a", soft: "#f8f3ea", deep: "#3a312a" },
    catchCopy: "落ち着いた接客と上品さを活かせる大人の働き方",
    keywords: ["上品", "大人の接客", "スキルアップ"],
    fitReason:
      "ていねいな言葉づかいや落ち着いた雰囲気を活かせるタイプです。上品な空間で、接客スキルをしっかり磨けます。",
    suitedFor: [
      { icon: "gem", label: "上品な雰囲気が好き" },
      { icon: "briefcase", label: "会社員の方との会話が得意" },
      { icon: "trending", label: "接客スキルを身につけたい" },
      { icon: "shirt", label: "綺麗めの服装で働きたい" },
    ],
    tips: [
      "姿勢や言葉づかいなど、基本のマナーを意識する",
      "季節の話題やニュースなど、大人の会話の引き出しを持つ",
      "お客様の名前や仕事の話を覚えて、次回に活かす",
    ],
    advice:
      "背伸びしすぎなくて大丈夫。ていねいに話を聞く姿勢が、そのまま上品さとして伝わります。",
  },
  クラブ: {
    key: "club",
    imageSrc: null,
    theme: { accent: "#b9965a", soft: "#f3f2f7", deep: "#23263a" },
    catchCopy: "フォーマルな接客で、ハイクラスな世界に挑戦できる",
    keywords: ["ハイクラス", "高単価", "フォーマル"],
    fitReason:
      "しっかり稼ぎたい気持ちと、フォーマルな接客への意欲を活かせるタイプです。ハイクラスなお客様との会話で、大きく成長できます。",
    suitedFor: [
      { icon: "trending", label: "しっかり稼ぎたい" },
      { icon: "wine", label: "お酒の席が苦にならない" },
      { icon: "crown", label: "ハイクラスな接客に挑戦したい" },
      { icon: "moon", label: "深夜帯も働ける" },
    ],
    tips: [
      "お酒の知識や作り方を少しずつ覚える",
      "体調管理のために、休む日をしっかり決める",
      "経済や時事の話題もチェックしておく",
    ],
    advice:
      "最初は先輩の接客をよく見て、言葉づかいや間の取り方を真似するところから始めましょう。",
  },
  "キャバクラ（ニュークラブ）": {
    key: "new-club",
    imageSrc: null,
    theme: { accent: "#c9a35c", soft: "#f8f4eb", deep: "#1d1a16" },
    catchCopy: "華やかさと接客力を武器に、高収入を目指せるスタイル",
    keywords: ["華やか", "高収入", "ドレス"],
    fitReason:
      "華やかな場で、ていねいなおもてなしを磨きたいタイプです。頑張りが収入に反映されやすく、目標を持って働けます。",
    suitedFor: [
      { icon: "gem", label: "ドレスや華やかな場が好き" },
      { icon: "trending", label: "高収入を目指したい" },
      { icon: "crown", label: "おもてなしを磨きたい" },
      { icon: "briefcase", label: "経営者層との会話に興味がある" },
    ],
    tips: [
      "お客様ごとの会話をメモして、指名につなげる",
      "来店のお礼LINEは、その日のうちに送る",
      "ヘアメイクや身だしなみで、第一印象を整える",
    ],
    advice:
      "最初は数字を気にしすぎず、一人ひとりのお客様にていねいに向き合うことが、指名への近道です。",
  },
};

/** 回答から「この職種で活かせるあなたの強み」を作る */
const STRENGTH_BY_ANSWER: Record<string, Record<string, string>> = {
  personality: {
    outgoing: "明るく話せる",
    shy_warm: "慣れた相手と深く話せる",
    good_listener: "聞き上手",
    fashionable: "おしゃれへの感度",
    competitive: "負けず嫌いな向上心",
  },
  serviceStyle: {
    friendly: "友達のような親しみやすさ",
    lively: "場を盛り上げる力",
    calm: "落ち着いた会話力",
    hospitality: "ていねいなおもてなし",
  },
};

export function buildDiagnosisStrengths(answers: {
  personality: string | null;
  serviceStyle: string | null;
}): string[] {
  const strengths = [
    answers.personality ? STRENGTH_BY_ANSWER.personality[answers.personality] : null,
    answers.serviceStyle ? STRENGTH_BY_ANSWER.serviceStyle[answers.serviceStyle] : null,
  ];
  return strengths.filter((item): item is string => Boolean(item));
}
