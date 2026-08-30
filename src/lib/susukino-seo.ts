import type { JobType } from "@/types/job";
import {
  getAreaJobTypeColumnLinks,
  buildAreaJobTypeSeoBody,
  type SeoColumnLink,
} from "@/lib/seo-area-job-type-content";
import {
  listPublishedSeoLandings,
  type BuiltSeoLandingPage,
} from "@/lib/seo-landing";

export const SUSUKINO_DISTRICT = "すすきの" as const;
export const SUSUKINO_BASE_PATH = "/sapporo/susukino";
export { SEO_JOBS_PAGE_SIZE } from "@/lib/seo-area-jobs";

export type SusukinoJobTypeSlug =
  | "girlsbar"
  | "girls-bar" // legacy alias resolved in getSusukinoJobTypePage
  | "new-club"
  | "lounge"
  | "snack"
  | "concept-cafe";

export type SusukinoContentSection = {
  heading: string;
  paragraphs: string[];
};

export type SusukinoJobTypePage = {
  slug: Exclude<SusukinoJobTypeSlug, "girls-bar">;
  jobType: JobType;
  displayName: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  guide: string[];
  faqs: Array<{ question: string; answer: string }>;
  columnLinks: SeoColumnLink[];
  /** Optional mid-page H2 blocks (e.g. girlsbar SEO). */
  contentSections?: SusukinoContentSection[];
  faqHeading?: string;
  breadcrumbLabel?: string;
};

function landingToSusukinoPage(
  landing: BuiltSeoLandingPage,
): SusukinoJobTypePage {
  return {
    slug: (landing.jobType.pathSlug ?? landing.jobType.slug) as Exclude<
      SusukinoJobTypeSlug,
      "girls-bar"
    >,
    jobType: landing.dbJobType,
    displayName: landing.displayName,
    path: landing.path,
    title: landing.title,
    description: landing.description,
    h1: landing.h1,
    intro: landing.intro,
    guide: landing.guide,
    faqs: landing.faqs,
    contentSections: landing.contentSections,
    faqHeading: landing.faqHeading,
    breadcrumbLabel: landing.breadcrumbLabel,
    columnLinks: getAreaJobTypeColumnLinks({
      areaKey: "すすきの",
      jobTypeSlug: landing.jobType.contentSlug,
    }),
  };
}

const SUSUKINO_JOB_TYPE_PAGES_RAW: Array<
  Omit<SusukinoJobTypePage, "intro" | "guide" | "columnLinks"> & {
    intro: string[];
    guide: string[];
    /** When true, keep RAW intro/guide instead of shared body copy. */
    useCustomCopy?: boolean;
    contentSections?: SusukinoContentSection[];
    faqHeading?: string;
  }
> = [
  // girlsbar is built from src/lib/seo-landing (seoLandingPages + profiles)
  {
    slug: "new-club",
    jobType: "ニュークラ",
    displayName: "ニュークラブ",
    path: `${SUSUKINO_BASE_PATH}/new-club`,
    title: "すすきののニュークラブ求人｜高時給・体験入店求人",
    description:
      "すすきののニュークラブ（ニュークラ）求人を掲載。高時給や体験入店を検討しやすい、審査通過店舗の求人を比較できます。体入ホワイトナイトは優良店のみを公開し、ドレスやルールの差も詳細で確認できます。",
    h1: "すすきののニュークラブ求人",
    intro: [
      "すすきののニュークラブ求人（当サイト表記はニュークラ）は、より丁寧な接客や高い時給帯を求める方に選ばれやすい職種です。札幌の夜職求人のなかでも、店舗ごとのルールやドレスコードの差が出やすいため、求人票の確認が重要です。",
      "White Night Jobでは、掲載審査を通過したニュークラブ求人だけを公開しています。体験入店の流れ、ノルマの有無、送迎、お酒が飲めなくても応募可能かなど、不安になりやすい点は詳細ページと店舗への事前相談で確認してください。",
    ],
    guide: [
      "高時給の求人ほど、勤務時間・同伴・ドレスなどの条件も合わせて読むのが大切です。数字だけで決めず、未経験歓迎か、体験入店から始められるかをチェックしましょう。",
      "日払いや送迎がある店舗は、生活リズムに合わせた働き方を探しやすい傾向があります。条件が自分に合うか分からない場合は、応募前に質問してから体験入店へ進むのが安心です。",
    ],
    faqs: [
      {
        question: "すすきののニュークラブは未経験でも応募できますか？",
        answer:
          "未経験歓迎の求人もあります。求められる接客やドレスコードは店舗差が大きいため、詳細を確認し、必要なら体験入店から始めるのがおすすめです。",
      },
      {
        question: "ニュークラブで体験入店はできますか？",
        answer:
          "体験入店可能な店舗があります。体入時の時給や勤務時間、必要な持ち物は事前に店舗へ確認してください。",
      },
      {
        question: "ノルマが心配です。どう確認すればよいですか？",
        answer:
          "待遇にノルマなしとある求人もありますが、同伴や売上に関するルールは店舗ごとに異なります。応募前に必ず質問して確認してください。",
      },
      {
        question: "日払いに対応しているニュークラブはありますか？",
        answer:
          "日払いOKの求人を待遇から探せます。精算タイミングは店舗ルールによるため、詳細ページと事前確認が必要です。",
      },
      {
        question: "求人と実際の条件が違う場合は？",
        answer:
          "納得できない条件での入店は見送って構いません。危険な店舗や虚偽が疑われる場合は、当サイトの報告フォームをご利用ください。",
      },
    ],
  },
];

export const SUSUKINO_JOB_TYPE_PAGES: SusukinoJobTypePage[] = (() => {
  const landingBySlug = new Map(
    listPublishedSeoLandings()
      .filter((page) => page.area.slug === "susukino")
      .map((page) => [page.jobType.pathSlug ?? page.jobType.slug, landingToSusukinoPage(page)]),
  );

  const fromRaw = SUSUKINO_JOB_TYPE_PAGES_RAW.filter(
    (page) => !landingBySlug.has(page.slug),
  ).map((page) => {
    const contentSlug = page.slug === "girlsbar" ? "girls-bar" : page.slug;
    const body = buildAreaJobTypeSeoBody({
      areaKey: "すすきの",
      jobTypeSlug: contentSlug,
    });
    const { useCustomCopy, ...rest } = page;
    return {
      ...rest,
      intro: useCustomCopy ? page.intro : body.intro,
      guide: useCustomCopy ? page.guide : body.guide,
      columnLinks: getAreaJobTypeColumnLinks({
        areaKey: "すすきの",
        jobTypeSlug: contentSlug,
      }),
    };
  });

  const girlsbar = landingBySlug.get("girlsbar");
  const lounge = landingBySlug.get("lounge");
  const snack = landingBySlug.get("snack");
  const conceptCafe = landingBySlug.get("concept-cafe");
  return [
    ...(girlsbar ? [girlsbar] : []),
    ...fromRaw,
    ...(lounge ? [lounge] : []),
    ...(snack ? [snack] : []),
    ...(conceptCafe ? [conceptCafe] : []),
  ];
})();

export const SUSUKINO_AREA_PAGE = {
  path: SUSUKINO_BASE_PATH,
  title: "すすきのの夜職求人・優良店求人",
  description:
    "すすきので安心して働ける夜職求人を掲載。ガールズバー、ニュークラブ、ラウンジ、スナック、コンカフェなど、掲載審査を通過した優良店の求人をエリア・職種・待遇から比較しながら探せます。体入ホワイトナイトは未経験の方も確認しやすい求人票を公開しています。",
  h1: "すすきのの夜職求人",
  intro: [
    "すすきのの夜職求人を探している方へ。White Night Job（体入ホワイトナイト）は、札幌の夜職求人のなかでも、掲載審査を通過した店舗だけを公開する求人サイトです。すすきのはガールズバー求人、ニュークラブ求人、ラウンジ求人、スナック求人、コンカフェ求人など職種の幅が広く、自分の希望に近い働き方を比較しやすいエリアです。",
    "未経験歓迎の店舗や、体験入店から始められる求人も掲載しています。日払い、送迎、ノルマなし、お酒が飲めなくても応募可能といった条件は求人ごとに異なるため、詳細ページで待遇や勤務時間を確認しながら候補を絞ってみてください。",
  ],
  beginnerGuide: [
    "夜職が初めての方は、いきなり応募するよりも、職種と待遇の希望を先に決めると迷いにくくなります。すすきのでは店舗数が多い分、雰囲気の差も大きいため、写真・紹介文・待遇タグをセットで見るのがおすすめです。",
    "不安な点は体験入店の前に店舗へ質問できます。条件の伝え方が分からない場合は、初めての方へ向けたガイドやコラムもあわせてご覧ください。",
  ],
  faqs: [
    {
      question: "すすきので未経験から働けますか？",
      answer:
        "はい。未経験歓迎の求人を掲載しています。待遇タグで「未経験者大歓迎」を選ぶか、職種別ページから条件を確認しながら探せます。研修やフォローの有無は店舗によって異なるため、詳細と事前相談で確認してください。",
    },
    {
      question: "体験入店できる求人はありますか？",
      answer:
        "体験入店を受け付けている店舗があります。求人詳細の案内を確認し、LINEや電話で日程や体入時給を相談してから進めるのがおすすめです。",
    },
    {
      question: "お酒が飲めなくても応募できますか？",
      answer:
        "お酒が飲めなくても応募可能な求人があります。待遇の「お酒飲めなくてもOK」を目印に探すか、応募前に店舗へ対応可否を確認してください。",
    },
    {
      question: "日払い可能な店舗はありますか？",
      answer:
        "日払いOKの求人を掲載しています。支払いタイミングは店舗ルールによるため、詳細ページと事前確認で実条件を確かめてください。",
    },
    {
      question: "求人内容と実際の条件が違う場合はどうすればいいですか？",
      answer:
        "まずは掲載内容との違いを店舗に確認し、納得できない場合は応募や入店を見送って問題ありません。危険な店舗や求人と実態が大きく異なる場合は、当サイトのブラック店舗報告からも情報を届けられます。",
    },
  ],
} as const;

export const SUSUKINO_BENEFIT_LINKS = [
  {
    label: "未経験歓迎",
    href: `/jobs?district=${encodeURIComponent(SUSUKINO_DISTRICT)}&benefit=${encodeURIComponent("未経験者大歓迎")}`,
  },
  {
    label: "日払い",
    href: `/jobs?district=${encodeURIComponent(SUSUKINO_DISTRICT)}&benefit=${encodeURIComponent("日払いOK")}`,
  },
  {
    label: "送迎あり",
    href: `/jobs?district=${encodeURIComponent(SUSUKINO_DISTRICT)}&benefit=${encodeURIComponent("送迎あり")}`,
  },
  {
    label: "ノルマなし",
    href: `/jobs?district=${encodeURIComponent(SUSUKINO_DISTRICT)}&benefit=${encodeURIComponent("ノルマなし")}`,
  },
  {
    label: "お酒が飲めなくてもOK",
    href: `/jobs?district=${encodeURIComponent(SUSUKINO_DISTRICT)}&benefit=${encodeURIComponent("お酒飲めなくてもOK")}`,
  },
] as const;

export const RELATED_AREA_LINKS: Array<{ label: string; href: string }> = [
  { label: "琴似の夜職求人", href: "/sapporo/kotoni" },
  ...listPublishedSeoLandings()
    .filter((page) => page.area.slug !== "susukino" && page.showInGlobalNav)
    .map((page) => ({
      label: page.globalNavLabel,
      href: page.path,
    })),
  { label: "北24条の夜職求人", href: "/sapporo/kita24jo" },
  { label: "手稲の夜職求人", href: "/sapporo/teine" },
  { label: "札幌の求人一覧を見る", href: "/jobs" },
];

export function getSusukinoJobTypePage(
  slug: string,
): SusukinoJobTypePage | undefined {
  const normalized = slug === "girls-bar" || slug === "girls_bar" ? "girlsbar" : slug;
  return SUSUKINO_JOB_TYPE_PAGES.find((page) => page.slug === normalized);
}

/** Canonical path for Susukino × ガールズバー SEO landing. */
export const SUSUKINO_GIRLSBAR_PATH = `${SUSUKINO_BASE_PATH}/girlsbar`;

/** User-facing SEO label (job type DB value remains ガールズバー). */
export function formatJobTypeSeoLabel(jobType: string): string {
  if (jobType === "ガールズバー") return "ガルバ（ガールズバー）";
  return jobType;
}

export function isSusukinoGirlsBarJob(job: {
  district: string;
  jobType: string;
}): boolean {
  return job.district === SUSUKINO_DISTRICT && job.jobType === "ガールズバー";
}
