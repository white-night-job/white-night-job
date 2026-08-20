import { getColumnArticle } from "@/data/column-articles";
import type { District, JobType } from "@/types/job";

export type SeoColumnLink = { label: string; href: string };

export type AreaJobTypeSeoSlug =
  | "girls-bar"
  | "new-club"
  | "lounge"
  | "snack"
  | "concept-cafe";

const JOB_TYPE_BY_SLUG: Record<
  AreaJobTypeSeoSlug,
  { jobType: JobType; displayName: string }
> = {
  "girls-bar": { jobType: "ガールズバー", displayName: "ガールズバー" },
  "new-club": { jobType: "ニュークラ", displayName: "ニュークラブ" },
  lounge: { jobType: "ラウンジ", displayName: "ラウンジ" },
  snack: { jobType: "スナック", displayName: "スナック" },
  "concept-cafe": { jobType: "コンカフェ", displayName: "コンカフェ" },
};

const AREA_FLAVOR: Record<
  string,
  { displayName: string; access: string; vibe: string; commute: string }
> = {
  すすきの: {
    displayName: "すすきの",
    access:
      "地下鉄南北線・東豊線や路面電車で通いやすく、閉店後の帰宅ルートも比較的確保しやすいエリアです。",
    vibe:
      "店舗数が多く雰囲気の差が出やすい一方、職種の幅が広いため希望条件に近い働き方を見つけやすいのが特長です。",
    commute:
      "終電時間・タクシー帰りの有無・送迎範囲を先に決めると、候補を絞り込みやすくなります。",
  },
  琴似: {
    displayName: "琴似",
    access:
      "地下鉄東西線やJRを利用して通う方が多く、すすきのほど混雑しない地域密着の空気感を探しやすいエリアです。",
    vibe:
      "落ち着いた接客や通いやすさを重視する方の候補になりやすく、店舗ごとの客層の差も事前確認が大切です。",
    commute:
      "自宅からの所要時間と終電、車通勤の可否を確認すると、継続しやすい働き方を選びやすくなります。",
  },
  北24条: {
    displayName: "北24条",
    access:
      "地下鉄南北線で通いやすく、学生やWワークの方が通いやすい立地として選ばれやすいエリアです。",
    vibe:
      "すすきの以外で現実的な通勤圏を探したい方に向いており、シフトの柔軟さや出勤日数の確認がポイントになります。",
    commute:
      "学業・本業の予定と希望出勤日数を先に整理すると、無理のない求人に絞れます。",
  },
  手稲: {
    displayName: "手稲",
    access:
      "地元で働きたい方や、中心部まで通わずに夜職を始めたい方が検討しやすいエリアです。",
    vibe:
      "地域密着型の店舗が多く、常連さんとの関係性や送迎・車通勤の条件が働きやすさに影響しやすい傾向があります。",
    commute:
      "送迎の有無や駐車場、帰宅時間帯を求人票と店舗確認で確かめることが大切です。",
  },
};

const JOB_TYPE_COPY: Record<
  AreaJobTypeSeoSlug,
  { about: string; style: string; check: string; beginner: string }
> = {
  "girls-bar": {
    about:
      "ガールズバーは会話を中心にした接客が多く、札幌の夜職のなかでも未経験から始めやすい職種のひとつです。ドリンク提供や簡単なゲーム、常連さんとのコミュニケーションが主な仕事になります。",
    style:
      "店舗によって客層・音量・ドレスコードが異なるため、写真と紹介文だけでなく待遇タグや勤務時間もあわせて確認しましょう。",
    check:
      "時給・体入時給、ノルマの有無、お酒が飲めなくても働けるか、日払い・送迎の有無は応募前の必須確認項目です。",
    beginner:
      "初めての方は未経験歓迎の求人から比較し、できれば体験入店で店内の空気感を確かめてから本入店を判断するのが安心です。",
  },
  "new-club": {
    about:
      "ニュークラブ（当サイト表記はニュークラ）は、より丁寧な接客や高い時給帯を求める方に選ばれやすい職種です。ドレスやマナー、同伴などのルールが店舗ごとに大きく異なります。",
    style:
      "高時給の数字だけに注目せず、勤務時間・衣装・必要な経験、研修の有無をセットで読むことが重要です。",
    check:
      "体験入店の可否、ノルマ、送迎、シフトの入りやすさ、バックや罰金ルールなど、不安になりやすい点は事前相談で解消しましょう。",
    beginner:
      "未経験歓迎でも求められる接客レベルに差があるため、まずは体験入店や面接前相談から進めるのがおすすめです。",
  },
  lounge: {
    about:
      "ラウンジは落ち着いた空間での接客が中心で、派手な盛り場感より会話や気配りを大切にしたい方に選ばれやすい職種です。",
    style:
      "店舗規模や客層によって働き方のテンポが変わるため、写真・紹介文・待遇を総合的に見て雰囲気をイメージしましょう。",
    check:
      "ドレスコード、希望出勤日数、お酒の対応、終電や送迎の有無を確認し、生活リズムに合うかを判断してください。",
    beginner:
      "未経験でも始めやすい店舗がありますが、求められる会話のテンポは店舗差があるため、体験入店で相性を確かめると安心です。",
  },
  snack: {
    about:
      "スナックは地域の常連さんとのコミュニケーションが中心になりやすく、長く通える距離感や無理のないシフトを重視する方に向いています。",
    style:
      "落ち着いた店舗が多い一方、個人店ならではのルールもあるため、求人票の記載と実際の店の雰囲気を丁寧に確認しましょう。",
    check:
      "週何日出勤できるか、日払いの有無、送迎、お酒の対応、閉店後の帰宅手段など、通い続けやすさに関わる条件を優先して見てください。",
    beginner:
      "初めての方は、未経験歓迎や体験入店のある求人から比較し、スタッフ対応や客層が自分に合うかを体入で確かめるのがおすすめです。",
  },
  "concept-cafe": {
    about:
      "コンカフェは世界観や衣装、会話を楽しむ接客が特長で、キャラクター性やテーマのあるお店で働きたい方に選ばれやすい職種です。",
    style:
      "店舗ごとのコンセプト差が大きいため、写真・衣装・営業時間・待遇タグをセットで確認し、自分のペースに合うかを見極めましょう。",
    check:
      "体入の流れ、ノルマ、衣装代やその他費用、シフトの柔軟さ、お酒対応の有無は応募前に必ず確認したいポイントです。",
    beginner:
      "未経験歓迎の求人もありますが、世界観へのなじみやすさは体入で感じる部分が大きいです。無理なく続けられる店舗を選びましょう。",
  },
};

const COLUMN_BY_JOB: Record<AreaJobTypeSeoSlug, string[]> = {
  "girls-bar": [
    "girls-bar-beginner",
    "girls-bar-vs-new-club",
    "trial-work-checklist",
    "night-job-first-guide",
  ],
  "new-club": [
    "girls-bar-vs-new-club",
    "trial-work-checklist",
    "night-job-interview",
    "night-job-first-guide",
  ],
  lounge: [
    "night-job-first-guide",
    "trial-work-checklist",
    "night-job-interview",
    "what-is-taiin",
  ],
  snack: [
    "night-job-first-guide",
    "trial-work-checklist",
    "no-alcohol-night-job",
    "what-is-taiin",
  ],
  "concept-cafe": [
    "concept-cafe-job",
    "trial-work-checklist",
    "night-job-first-guide",
    "what-is-taiin",
  ],
};

const AREA_EXTRA_COLUMNS: Record<string, string[]> = {
  すすきの: ["susukino-night-job-beginner", "sapporo-trial-shops"],
  琴似: ["sapporo-trial-shops", "what-is-white-night"],
  北24条: ["sapporo-trial-shops", "night-job-interview"],
  手稲: ["sapporo-trial-shops", "no-alcohol-night-job"],
};

function charLength(parts: string[]): number {
  return [...parts.join("")].length;
}

/**
 * Build SEO body (intro + guide) for area × job-type pages.
 * Target: 800–1,500 Japanese characters.
 */
export function buildAreaJobTypeSeoBody(params: {
  areaKey: "すすきの" | "琴似" | "北24条" | "手稲";
  jobTypeSlug: AreaJobTypeSeoSlug;
}): { intro: string[]; guide: string[]; bodyCharCount: number } {
  const area = AREA_FLAVOR[params.areaKey];
  const job = JOB_TYPE_COPY[params.jobTypeSlug];
  const meta = JOB_TYPE_BY_SLUG[params.jobTypeSlug];

  const intro = [
    `${area.displayName}の${meta.displayName}求人を探している方へ。体入ホワイトナイト（White Night Job）は、掲載審査を通過した店舗だけを公開する札幌の夜職求人サイトです。${area.vibe}`,
    `${job.about}${area.access}`,
    `${area.displayName}で${meta.displayName}を選ぶときは、時給だけでなく通勤・シフト・待遇のバランスが大切です。${job.style}`,
    `当サイトでは、公開中の${area.displayName}×${meta.displayName}の求人を条件から比較できます。未経験歓迎、体験入店、日払い、送迎、ノルマなし、お酒飲めなくてもOKなどのタグを活用し、自分の希望に近い店舗だけを絞り込んでください。`,
  ];

  const guide = [
    `${job.beginner}${area.commute}`,
    `${job.check}条件の認識違いを防ぐため、面接前相談や体験入店前の質問を活用するのがおすすめです。`,
    `${area.displayName}の${meta.displayName}求人は公開状況が変わるため、待遇タグと詳細の両方を見ながら候補を更新していくのが失敗しにくい進め方です。気になる店舗は比較機能やお気に入りも活用し、時給・シフト・アクセスを並べて検討してください。`,
    `求人内容と実態が異なると感じた場合は、無理に進めず応募を停止して構いません。危険な店舗が疑われるときはブラック店舗報告もご利用ください。初めての方はガイドや関連コラムもあわせて読むと、失敗しにくい順番でお店選びを進められます。`,
  ];

  const bodyCharCount = charLength([...intro, ...guide]);
  return { intro, guide, bodyCharCount };
}

export function getAreaJobTypeColumnLinks(params: {
  areaKey: "すすきの" | "琴似" | "北24条" | "手稲";
  jobTypeSlug?: AreaJobTypeSeoSlug;
}): SeoColumnLink[] {
  const slugs = [
    ...(params.jobTypeSlug ? COLUMN_BY_JOB[params.jobTypeSlug] : []),
    ...(AREA_EXTRA_COLUMNS[params.areaKey] ?? []),
    "trial-work-checklist",
    "night-job-first-guide",
  ];

  const seen = new Set<string>();
  const links: SeoColumnLink[] = [];
  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const article = getColumnArticle(slug);
    if (!article) continue;
    links.push({
      label: article.title,
      href: `/column/${article.slug}`,
    });
    if (links.length >= 4) break;
  }
  return links;
}

export function displayNameForJobTypeSlug(slug: AreaJobTypeSeoSlug): string {
  return JOB_TYPE_BY_SLUG[slug].displayName;
}

export function districtKeyFromDisplay(
  displayName: string,
): "すすきの" | "琴似" | "北24条" | "手稲" | null {
  if (
    displayName === "すすきの" ||
    displayName === "琴似" ||
    displayName === "北24条" ||
    displayName === "手稲"
  ) {
    return displayName;
  }
  return null;
}

export function districtKeyFromDbDistrict(
  district: District | string,
): "すすきの" | "琴似" | "北24条" | "手稲" | null {
  if (district === "24条") return "北24条";
  if (
    district === "すすきの" ||
    district === "琴似" ||
    district === "手稲"
  ) {
    return district;
  }
  return null;
}
