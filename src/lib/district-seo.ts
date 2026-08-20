import type { District, JobType } from "@/types/job";
import {
  buildAreaJobTypeSeoBody,
  getAreaJobTypeColumnLinks,
  type AreaJobTypeSeoSlug,
  type SeoColumnLink,
} from "@/lib/seo-area-job-type-content";

export { resolveDistrictSeoPaths } from "@/lib/district-seo-paths";

export type DistrictSeoSlug = "kotoni" | "kita24jo" | "teine";

export type DistrictJobTypeSlug =
  | "girls-bar"
  | "new-club"
  | "lounge"
  | "snack"
  | "concept-cafe";

export type DistrictFaq = { question: string; answer: string };

export type DistrictJobTypePage = {
  slug: DistrictJobTypeSlug;
  jobType: JobType;
  displayName: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  guide: string[];
  faqs: DistrictFaq[];
  columnLinks: SeoColumnLink[];
};

export type DistrictAreaPage = {
  slug: DistrictSeoSlug;
  /** DB district value */
  district: District;
  /** Display name (e.g. 北24条) */
  displayName: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  beginnerGuide: string[];
  faqs: DistrictFaq[];
  columnLinks: Array<{ label: string; href: string }>;
  jobTypePages: DistrictJobTypePage[];
};

const JOB_TYPE_META: Array<{
  slug: DistrictJobTypeSlug;
  jobType: JobType;
  displayName: string;
}> = [
  { slug: "girls-bar", jobType: "ガールズバー", displayName: "ガールズバー" },
  { slug: "new-club", jobType: "ニュークラ", displayName: "ニュークラブ" },
  { slug: "lounge", jobType: "ラウンジ", displayName: "ラウンジ" },
  { slug: "snack", jobType: "スナック", displayName: "スナック" },
  { slug: "concept-cafe", jobType: "コンカフェ", displayName: "コンカフェ" },
];

function benefitLinks(district: District) {
  return [
    {
      label: "未経験歓迎",
      href: `/jobs?district=${encodeURIComponent(district)}&benefit=${encodeURIComponent("未経験者大歓迎")}`,
    },
    {
      label: "日払い",
      href: `/jobs?district=${encodeURIComponent(district)}&benefit=${encodeURIComponent("日払いOK")}`,
    },
    {
      label: "送迎あり",
      href: `/jobs?district=${encodeURIComponent(district)}&benefit=${encodeURIComponent("送迎あり")}`,
    },
    {
      label: "ノルマなし",
      href: `/jobs?district=${encodeURIComponent(district)}&benefit=${encodeURIComponent("ノルマなし")}`,
    },
    {
      label: "お酒が飲めなくてもOK",
      href: `/jobs?district=${encodeURIComponent(district)}&benefit=${encodeURIComponent("お酒飲めなくてもOK")}`,
    },
  ] as const;
}

function ensureMetaDescription(description: string): string {
  const chars = [...description];
  if (chars.length >= 120) {
    return chars.length > 160 ? chars.slice(0, 160).join("") : description;
  }
  const pad =
    "体入ホワイトナイトでは掲載審査を通過した店舗のみを公開し、条件を比較しながら安心して探せます。";
  return `${description}${pad}`;
}

function buildJobTypePages(
  area: Pick<DistrictAreaPage, "slug" | "district" | "displayName" | "path">,
  content: Record<
    DistrictJobTypeSlug,
    {
      faqs: DistrictFaq[];
      titleHint: string;
      desc: string;
      /** @deprecated Replaced by buildAreaJobTypeSeoBody */
      intro?: string[];
      /** @deprecated Replaced by buildAreaJobTypeSeoBody */
      guide?: string[];
    }
  >,
): DistrictJobTypePage[] {
  const areaKey =
    area.displayName === "北24条"
      ? "北24条"
      : area.displayName === "琴似"
        ? "琴似"
        : area.displayName === "手稲"
          ? "手稲"
          : null;
  if (!areaKey) {
    throw new Error(`Unsupported district SEO area: ${area.displayName}`);
  }

  return JOB_TYPE_META.map((meta) => {
    const c = content[meta.slug];
    const body = buildAreaJobTypeSeoBody({
      areaKey,
      jobTypeSlug: meta.slug as AreaJobTypeSeoSlug,
    });
    return {
      ...meta,
      path: `${area.path}/${meta.slug}`,
      title: `${area.displayName}の${meta.displayName}求人｜${c.titleHint}`,
      description: ensureMetaDescription(c.desc),
      h1: `${area.displayName}の${meta.displayName}求人`,
      intro: body.intro,
      guide: body.guide,
      faqs: c.faqs,
      columnLinks: getAreaJobTypeColumnLinks({
        areaKey,
        jobTypeSlug: meta.slug as AreaJobTypeSeoSlug,
      }),
    };
  });
}

const kotoniJobTypes = buildJobTypePages(
  {
    slug: "kotoni",
    district: "琴似",
    displayName: "琴似",
    path: "/sapporo/kotoni",
  },
  {
    "girls-bar": {
      titleHint: "地域密着の優良店求人",
      desc: "琴似のガールズバー求人を掲載。落ち着いたエリアで未経験から始めやすい求人を、待遇や勤務条件から探せます。",
      intro: [
        "琴似のガールズバー求人は、すすきのほどの混雑感が少なく、会話を丁寧に重ねる店舗を探しやすい傾向があります。White Night Jobでは掲載審査を通過した店舗のみを公開しています。",
        "地下鉄・JRからのアクセスを活かしつつ、未経験歓迎や体験入店の有無は求人ごとに異なります。詳細で時給・シフト・送迎などを確認してから応募してください。",
      ],
      guide: [
        "初めての方は未経験歓迎のタグがある求人から比較するのがおすすめです。琴似は店舗規模や客層の差もあるため、写真と紹介文もあわせて見てください。",
        "体験入店ができる場合は、通勤ルートと帰宅時間も事前に確認すると安心です。",
      ],
      faqs: [
        {
          question: "琴似でガールズバーは未経験から働けますか？",
          answer:
            "未経験歓迎の求人がある場合があります。研修の有無は店舗ごとに異なるため、詳細と事前相談で確認してください。",
        },
        {
          question: "体験入店はできますか？",
          answer:
            "体験入店を受け付ける店舗があります。体入時給や勤務時間は事前に確認しましょう。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer:
            "お酒飲めなくてもOKの求人がある場合があります。対応可否は店舗確認が必要です。",
        },
        {
          question: "日払いや送迎はありますか？",
          answer:
            "日払いOK・送迎ありの求人を待遇から探せます。実際の条件は求人票と店舗に確認してください。",
        },
        {
          question: "求人と条件が違うときは？",
          answer:
            "応募や体験入店を見送って問題ありません。危険なケースはブラック店舗報告も利用できます。",
        },
      ],
    },
    "new-club": {
      titleHint: "条件を比較しやすい求人",
      desc: "琴似のニュークラブ（ニュークラ）求人を掲載。時給や勤務条件を確認しながら、審査通過店舗の求人を探せます。",
      intro: [
        "琴似のニュークラブ求人（当サイト表記はニュークラ）は、店舗数がすすきのより限られるぶん、条件をじっくり比較しやすいエリアです。",
        "ドレスコードや勤務時間の差が出やすい職種のため、求人詳細と事前質問をセットで確認してください。",
      ],
      guide: [
        "高時給だけに注目せず、シフト・ノルマ・体験入店の有無を必ず確認しましょう。",
        "通勤手段と終電のタイミングも、琴似で探すときの重要な判断材料です。",
      ],
      faqs: [
        {
          question: "琴似のニュークラブは未経験でも応募できますか？",
          answer:
            "未経験歓迎の求人がある場合があります。求められる接客は店舗差が大きいため詳細確認が必要です。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。体入条件は事前に確認してください。",
        },
        {
          question: "ノルマはありますか？",
          answer:
            "ノルマなしの求人もありますが、ルールは店舗ごとに異なります。応募前に質問してください。",
        },
        {
          question: "日払いはありますか？",
          answer:
            "日払いOKの求人を待遇から探せます。精算タイミングは店舗ルールによります。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、応募をストップして構いません。報告フォームも利用できます。",
        },
      ],
    },
    lounge: {
      titleHint: "落ち着いて働ける求人",
      desc: "琴似のラウンジ求人を掲載。落ち着いた接客を検討している方向けに、審査通過店舗の求人を集めました。",
      intro: [
        "琴似のラウンジ求人は、地域に根ざした落ち着いた雰囲気の店舗を探しやすい職種です。すすきの以外で働きたい方の候補にもなります。",
        "未経験歓迎や体験入店の有無は店舗ごとに異なるため、詳細ページで確認してください。",
      ],
      guide: [
        "営業時間と生活リズムが合うかを先に決めると、琴似エリアでのミスマッチを減らしやすいです。",
        "初めての方は体験入店や事前相談から始めるのがおすすめです。",
      ],
      faqs: [
        {
          question: "琴似のラウンジは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。詳細で確認してください。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な店舗もあります。応募前に確認してください。",
        },
        {
          question: "送迎はありますか？",
          answer: "送迎ありの求人を待遇から探せます。範囲は店舗確認が必要です。",
        },
        {
          question: "条件が違うときは？",
          answer: "応募を見送り、必要ならブラック店舗報告をご利用ください。",
        },
      ],
    },
    snack: {
      titleHint: "地域密着の求人",
      desc: "琴似のスナック求人を掲載。地域密着の接客を検討している方向けに、審査通過店舗の求人を探せます。",
      intro: [
        "琴似のスナック求人は、常連さんとの会話を大切にする地域密着型の働き方をイメージしやすい職種です。",
        "少人数店舗もあるため、雰囲気の相性は体験入店で確かめるのがおすすめです。",
      ],
      guide: [
        "勤務時間と待遇タグをセットで確認し、無理のないシフトから始めましょう。",
        "未経験歓迎の求人がある場合は、そのタグから絞り込むと探しやすいです。",
      ],
      faqs: [
        {
          question: "琴似のスナックは未経験でも大丈夫ですか？",
          answer: "未経験歓迎の求人がある場合があります。店舗ごとに確認してください。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。",
        },
        {
          question: "日払いはありますか？",
          answer: "日払いOKの求人を待遇から探せます。",
        },
        {
          question: "ノルマなしはありますか？",
          answer: "ノルマなしと掲載している求人があります。実ルールは事前確認が必要です。",
        },
        {
          question: "求人と違う場合は？",
          answer: "入店を急がず、条件の再確認や応募取り下げを行ってください。",
        },
      ],
    },
    "concept-cafe": {
      titleHint: "通いやすいエリアの求人",
      desc: "琴似のコンカフェ求人を掲載。コンセプトや衣装の条件を確認しながら、審査通過店舗の求人を探せます。",
      intro: [
        "琴似のコンカフェ求人は、すすきのまで通わず世界観のある接客を探したい方の選択肢になります。",
        "コンセプトや衣装ルールは店舗差が大きいため、詳細と写真をよく確認してください。",
      ],
      guide: [
        "未経験の方は体験入店ができる求人から始めると安心です。",
        "通勤手段とシフトの両立も、琴似で探すときのポイントです。",
      ],
      faqs: [
        {
          question: "琴似のコンカフェは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な求人がある場合があります。事前確認が必要です。",
        },
        {
          question: "送迎や日払いはありますか？",
          answer: "待遇タグから探せます。実条件は店舗確認が必要です。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、相談や応募を停止して構いません。",
        },
      ],
    },
  },
);

const kita24joJobTypes = buildJobTypePages(
  {
    slug: "kita24jo",
    district: "24条",
    displayName: "北24条",
    path: "/sapporo/kita24jo",
  },
  {
    "girls-bar": {
      titleHint: "通いやすい優良店求人",
      desc: "北24条のガールズバー求人を掲載。地下鉄南北線沿いで通いやすい求人を、未経験歓迎などの条件から探せます。",
      intro: [
        "北24条のガールズバー求人は、地下鉄南北線で通いやすい立地を活かし、学生やWワークの方が検討しやすいエリアです。",
        "White Night Jobでは掲載審査を通過した店舗のみを公開しています。すすきの以外で探す方は、まず公開中の求人票で勤務時間と待遇を確認してください。",
      ],
      guide: [
        "授業や本業のシフトと両立しやすいよう、週1出勤OKなどの待遇もあわせて見てみましょう。",
        "体験入店前に終電や帰宅手段を確認すると、無理のない働き方を選びやすくなります。",
      ],
      faqs: [
        {
          question: "北24条でガールズバーは未経験から働けますか？",
          answer:
            "未経験歓迎の求人がある場合があります。詳細と事前相談で確認してください。",
        },
        {
          question: "学生やWワークでも応募できますか？",
          answer:
            "シフトの柔軟さは店舗によります。希望日数は面接や相談時に伝え、求人の待遇タグも確認してください。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な求人がある場合があります。応募前に確認してください。",
        },
        {
          question: "求人と条件が違うときは？",
          answer: "応募を見送り、必要ならブラック店舗報告をご利用ください。",
        },
      ],
    },
    "new-club": {
      titleHint: "南北線沿いで探す求人",
      desc: "北24条のニュークラブ（ニュークラ）求人を掲載。通勤しやすさと条件面を比較しながら探せます。",
      intro: [
        "北24条のニュークラブ求人は、南北線での通勤を前提に条件を比較しやすいのが特徴です。店舗数は限られることがあるため、公開中の求人を丁寧に確認してください。",
        "時給だけでなく、勤務時間やドレスコードも必ず見ておきましょう。",
      ],
      guide: [
        "Wワークの方は、終業後に通える時間帯かを最優先で確認するのがおすすめです。",
        "体験入店がある場合は、短い時間から雰囲気を確かめてください。",
      ],
      faqs: [
        {
          question: "北24条のニュークラブは未経験でも応募できますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。",
        },
        {
          question: "ノルマはありますか？",
          answer: "店舗ごとに異なります。応募前に確認してください。",
        },
        {
          question: "日払いはありますか？",
          answer: "日払いOKの求人を待遇から探せます。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、応募をストップして構いません。",
        },
      ],
    },
    lounge: {
      titleHint: "通いやすさ重視の求人",
      desc: "北24条のラウンジ求人を掲載。通勤しやすさを重視しつつ、審査通過店舗の求人を探せます。",
      intro: [
        "北24条のラウンジ求人は、地下鉄沿線で通いながら落ち着いた接客を検討したい方に選ばれることがあります。",
        "客層や営業時間は店舗差があるため、詳細ページで確認してください。",
      ],
      guide: [
        "学業や本業との両立を考える方は、希望シフトを先に整理してから求人を絞りましょう。",
        "不安な点は面接前相談や店舗への質問も活用できます。",
      ],
      faqs: [
        {
          question: "北24条のラウンジは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な店舗もあります。事前確認が必要です。",
        },
        {
          question: "送迎はありますか？",
          answer: "送迎ありの求人を待遇から探せます。",
        },
        {
          question: "条件が違うときは？",
          answer: "応募を見送り、必要なら報告フォームを利用してください。",
        },
      ],
    },
    snack: {
      titleHint: "地域密着の求人",
      desc: "北24条のスナック求人を掲載。地域密着型の働き方を検討している方向けの求人です。",
      intro: [
        "北24条のスナック求人は、地域に根ざした接客スタイルの店舗を探すときの候補になります。",
        "公開中の求人がある場合のみこのページに掲載されます。待遇は求人票で確認してください。",
      ],
      guide: [
        "少人数店舗では雰囲気の相性が重要なので、可能なら体験入店で確かめてください。",
        "通勤時間と帰宅手段もあわせて検討しましょう。",
      ],
      faqs: [
        {
          question: "北24条のスナックは未経験でも大丈夫ですか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。",
        },
        {
          question: "日払いはありますか？",
          answer: "日払いOKの求人を待遇から探せます。",
        },
        {
          question: "ノルマなしはありますか？",
          answer: "ノルマなしと掲載している求人があります。実ルールは確認が必要です。",
        },
        {
          question: "求人と違う場合は？",
          answer: "条件の再確認や応募取り下げを行い、危険な場合は報告してください。",
        },
      ],
    },
    "concept-cafe": {
      titleHint: "南北線沿いで探す求人",
      desc: "北24条のコンカフェ求人を掲載。通いやすさとコンセプトを比較しながら探せます。",
      intro: [
        "北24条のコンカフェ求人は、すすきの以外でコンセプトのある接客を探したい方の選択肢です。",
        "衣装や世界観のルールは店舗ごとに異なるため、詳細をよく読んでから応募してください。",
      ],
      guide: [
        "学生・Wワークの方は、シフトの入りやすさを優先して比較するのがおすすめです。",
        "体験入店ができる求人なら、店内の空気感を先に確かめられます。",
      ],
      faqs: [
        {
          question: "北24条のコンカフェは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な求人がある場合があります。",
        },
        {
          question: "送迎や日払いはありますか？",
          answer: "待遇タグから探せます。実条件は店舗確認が必要です。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、応募を停止して構いません。",
        },
      ],
    },
  },
);

const teineJobTypes = buildJobTypePages(
  {
    slug: "teine",
    district: "手稲",
    displayName: "手稲",
    path: "/sapporo/teine",
  },
  {
    "girls-bar": {
      titleHint: "地元で探せる優良店求人",
      desc: "手稲のガールズバー求人を掲載。地元で働きたい方向けに、審査通過店舗の求人を待遇や勤務条件から探せます。",
      intro: [
        "手稲のガールズバー求人は、すすきのまで通わず地元で働きたい方に選ばれることがあります。White Night Jobでは掲載審査を通過した店舗のみを公開しています。",
        "送迎や車通勤に関する待遇は求人ごとに異なるため、登録されているタグと詳細を確認してください。存在しない条件は記載していません。",
      ],
      guide: [
        "地元密着の店舗では、常連さんとの関係性が働きやすさに影響することがあります。可能なら体験入店で雰囲気を確かめてください。",
        "未経験の方は、未経験歓迎の求人から比較するのがおすすめです。",
      ],
      faqs: [
        {
          question: "手稲でガールズバーは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。詳細で確認してください。",
        },
        {
          question: "送迎や車通勤はできますか？",
          answer:
            "送迎ありなどの待遇がある求人をタグから探せます。駐車場や送迎範囲は店舗確認が必要です。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な求人がある場合があります。事前確認が必要です。",
        },
        {
          question: "求人と条件が違うときは？",
          answer: "応募を見送り、必要ならブラック店舗報告をご利用ください。",
        },
      ],
    },
    "new-club": {
      titleHint: "地元エリアの求人",
      desc: "手稲のニュークラブ（ニュークラ）求人を掲載。地元で働ける求人を条件から比較できます。",
      intro: [
        "手稲のニュークラブ求人は、遠方への通勤を避けたい方が条件面を比較するためのページです。公開中の求人がある場合のみ表示されます。",
        "時給・勤務時間・ドレスなどの条件は店舗差が大きいため、詳細を必ず確認してください。",
      ],
      guide: [
        "通勤手段と帰宅時間を先に決めてから求人を絞り込むと、手稲エリアではミスマッチを減らしやすいです。",
        "体験入店がある場合は短い時間から雰囲気を確かめましょう。",
      ],
      faqs: [
        {
          question: "手稲のニュークラブは未経験でも応募できますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。",
        },
        {
          question: "ノルマはありますか？",
          answer: "店舗ごとに異なります。応募前に確認してください。",
        },
        {
          question: "日払いはありますか？",
          answer: "日払いOKの求人を待遇から探せます。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、応募をストップして構いません。",
        },
      ],
    },
    lounge: {
      titleHint: "地域密着の求人",
      desc: "手稲のラウンジ求人を掲載。地元で落ち着いて働きたい方向けの求人です。",
      intro: [
        "手稲のラウンジ求人は、地域密着の雰囲気のなかで接客したい方の候補になります。",
        "公開中求人の待遇・勤務時間を確認し、自分の生活圏に合うか判断してください。",
      ],
      guide: [
        "初めての方は未経験歓迎や体験入店がある求人から比較するのがおすすめです。",
        "不安な点は面接前相談も利用できます。",
      ],
      faqs: [
        {
          question: "手稲のラウンジは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な店舗もあります。事前確認が必要です。",
        },
        {
          question: "送迎はありますか？",
          answer: "送迎ありの求人を待遇から探せます。範囲は店舗確認が必要です。",
        },
        {
          question: "条件が違うときは？",
          answer: "応募を見送り、必要なら報告フォームを利用してください。",
        },
      ],
    },
    snack: {
      titleHint: "地元密着の求人",
      desc: "手稲のスナック求人を掲載。地元で地域密着型の働き方を検討している方向けです。",
      intro: [
        "手稲のスナック求人は、常連さんとの会話を大切にする地域密着型の店舗を探すときに役立ちます。",
        "求人が公開されている場合のみ掲載します。条件は求人票の記載を優先してください。",
      ],
      guide: [
        "少人数店舗では人間関係の相性が重要なので、体験入店で確かめるのが安心です。",
        "送迎や日払いなど、登録されている待遇タグから絞り込めます。",
      ],
      faqs: [
        {
          question: "手稲のスナックは未経験でも大丈夫ですか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店可能な店舗があります。",
        },
        {
          question: "日払いはありますか？",
          answer: "日払いOKの求人を待遇から探せます。",
        },
        {
          question: "ノルマなしはありますか？",
          answer: "ノルマなしと掲載している求人があります。実ルールは確認が必要です。",
        },
        {
          question: "求人と違う場合は？",
          answer: "条件の再確認や応募取り下げを行ってください。",
        },
      ],
    },
    "concept-cafe": {
      titleHint: "地元で探せる求人",
      desc: "手稲のコンカフェ求人を掲載。地元でコンセプトのある接客を検討している方向けです。",
      intro: [
        "手稲のコンカフェ求人は、すすきのまで通わず世界観のある接客を探したい方の選択肢です。",
        "コンセプトや衣装ルールは店舗差が大きいため、詳細を確認してから応募してください。",
      ],
      guide: [
        "体験入店ができる求人なら、店内の空気感を先に確かめられます。",
        "通勤手段とシフトの両立も、手稲で探すときのポイントです。",
      ],
      faqs: [
        {
          question: "手稲のコンカフェは未経験から働けますか？",
          answer: "未経験歓迎の求人がある場合があります。",
        },
        {
          question: "体験入店はできますか？",
          answer: "体験入店を受け付ける店舗があります。",
        },
        {
          question: "お酒が飲めなくても応募できますか？",
          answer: "対応可能な求人がある場合があります。",
        },
        {
          question: "送迎や日払いはありますか？",
          answer: "待遇タグから探せます。実条件は店舗確認が必要です。",
        },
        {
          question: "条件が違うと感じたら？",
          answer: "無理に進めず、応募を停止して構いません。",
        },
      ],
    },
  },
);

export const DISTRICT_AREA_PAGES: DistrictAreaPage[] = [
  {
    slug: "kotoni",
    district: "琴似",
    displayName: "琴似",
    path: "/sapporo/kotoni",
    title: "琴似の夜職求人・ガールズバー求人",
    description:
      "札幌・琴似で安心して働ける夜職求人を掲載。ガールズバー、スナック、コンカフェなど、未経験歓迎・日払い・送迎ありの条件から、審査済み優良店を比較して探せます。体入ホワイトナイトは掲載審査通過店のみ公開しています。",
    h1: "琴似の夜職求人",
    intro: [
      "琴似の夜職求人を探している方へ。White Night Job（体入ホワイトナイト）は、掲載審査を通過した店舗だけを公開する札幌の夜職求人サイトです。琴似はすすきのより落ち着いたエリアで、地域密着型の店舗を比較しながら働き方を選びやすい傾向があります。",
      "地下鉄やJRからのアクセスを意識しつつ、ガールズバー・スナック・コンカフェなど公開中の職種を確認できます。未経験者向けの求人がある場合は待遇タグから絞り込めます。日払い・送迎などの条件は求人ごとに異なるため、詳細ページの記載を優先してください。",
    ],
    beginnerGuide: [
      "初めての方は、いきなり応募するより職種と通勤ルートを先に決めると迷いにくくなります。琴似では店舗ごとの雰囲気差もあるため、写真・紹介文・待遇をセットで見てください。",
      "不安な点は体験入店前に店舗へ質問できます。探し方が分からない場合は、初めての方へ向けたガイドやコラムも参考にしてください。",
    ],
    faqs: [
      {
        question: "琴似で未経験から夜職を始められますか？",
        answer:
          "未経験歓迎の求人がある場合があります。待遇タグや求人詳細で確認し、研修の有無は店舗に質問してください。",
      },
      {
        question: "すすきのより落ち着いたエリアで探せますか？",
        answer:
          "琴似は地域密着型の店舗が多く、すすきの以外で働きたい方の候補になります。ただし店舗ごとに雰囲気は異なるため、詳細で確認してください。",
      },
      {
        question: "アクセスは良いですか？",
        answer:
          "地下鉄やJRを利用して通う方が多いエリアです。実際の最寄駅や徒歩分数は求人のアクセス欄を確認してください。",
      },
      {
        question: "日払いや送迎のある求人はありますか？",
        answer:
          "該当する待遇タグの求人を掲載している場合があります。支払いタイミングや送迎範囲は店舗ルールによります。",
      },
      {
        question: "求人内容と違う場合はどうすればよいですか？",
        answer:
          "応募や体験入店を見送って問題ありません。危険な店舗が疑われる場合はブラック店舗報告をご利用ください。",
      },
    ],
    columnLinks: [
      {
        label: "すすきので未経験から夜職を始める方法",
        href: "/column/susukino-night-job-beginner",
      },
      { label: "夜職の体験入店で確認するポイント", href: "/column/trial-work-checklist" },
      { label: "初めての方へ", href: "/first-time-guide" },
    ],
    jobTypePages: kotoniJobTypes,
  },
  {
    slug: "kita24jo",
    district: "24条",
    displayName: "北24条",
    path: "/sapporo/kita24jo",
    title: "北24条の夜職求人・ガールズバー求人",
    description:
      "札幌・北24条の夜職求人を掲載。ガールズバー、スナック、コンカフェなど、未経験歓迎や日払いの条件から審査済み優良店を比較できます。体入ホワイトナイトは掲載審査通過店のみ公開しています。",
    h1: "北24条の夜職求人",
    intro: [
      "北24条の夜職求人を探している方へ。地下鉄南北線で通いやすい立地を活かし、学生やWワークの方がすすきの以外の選択肢として検討しやすいエリアです。",
      "White Night Jobでは掲載審査を通過した店舗のみを公開しています。地域密着型の店舗や、未経験歓迎・日払いなどの条件は求人ごとに異なるため、公開中の求人票で確認しながら比較してください。",
    ],
    beginnerGuide: [
      "学業や本業がある方は、希望の出勤日数と終電のタイミングを先に決めてから求人を絞ると失敗しにくくなります。",
      "職種選びに迷う場合は職種診断やコラムも活用し、条件が合う店舗だけに応募するのがおすすめです。",
    ],
    faqs: [
      {
        question: "北24条はどんなエリアですか？",
        answer:
          "札幌市北区・地下鉄南北線の北24条駅周辺エリアです。通いやすさを重視して求人を比較しやすい地域です。",
      },
      {
        question: "学生やWワークでも働けますか？",
        answer:
          "シフトの柔軟さは店舗によります。週1出勤OKなどの待遇がある求人から探すか、希望日数を事前に伝えて確認してください。",
      },
      {
        question: "未経験でも応募できますか？",
        answer:
          "未経験歓迎の求人がある場合があります。研修やフォローの有無は店舗ごとに異なります。",
      },
      {
        question: "すすきの以外で探すメリットは？",
        answer:
          "通勤時間を短くしたい方や、混雑の少ないエリアで働きたい方の選択肢になります。雰囲気は店舗差が大きい点に注意してください。",
      },
      {
        question: "求人内容と違う場合は？",
        answer:
          "納得できない場合は応募を見送って問題ありません。危険なケースはブラック店舗報告も利用できます。",
      },
    ],
    columnLinks: [
      { label: "ガールズバーとニュークラの違い", href: "/column/girls-bar-vs-new-club" },
      { label: "夜職の面接で聞かれることと準備", href: "/column/night-job-interview" },
      { label: "職種診断を試す", href: "/diagnosis" },
    ],
    jobTypePages: kita24joJobTypes,
  },
  {
    slug: "teine",
    district: "手稲",
    displayName: "手稲",
    path: "/sapporo/teine",
    title: "手稲の夜職求人・ガールズバー求人",
    description:
      "札幌・手稲で働ける夜職求人を掲載。ガールズバー、スナック、コンカフェなど、地域密着型の店舗を待遇や勤務条件から比較できます。体入ホワイトナイトは掲載審査通過店のみ公開しています。",
    h1: "手稲の夜職求人",
    intro: [
      "手稲の夜職求人を探している方へ。地元で働きたい方や、すすきのまで通わずに夜職を始めたい方にとって、手稲は現実的な選択肢になり得ます。White Night Jobでは掲載審査を通過した店舗のみを公開しています。",
      "送迎や車通勤など、実際に登録されている待遇タグから絞り込めます。存在しない条件は書いていません。公開中の求人が少ない時期もあるため、その場合は説明文と他エリアへの導線から比較してください。",
    ],
    beginnerGuide: [
      "地元密着の店舗では、常連さんとの関係性やシフトの入り方が働きやすさに影響することがあります。写真だけでなく待遇とアクセスを確認しましょう。",
      "初めての方は体験入店や事前相談から始め、合わないと感じたら無理に入店しなくて大丈夫です。",
    ],
    faqs: [
      {
        question: "手稲で未経験から夜職を始められますか？",
        answer:
          "未経験歓迎の求人がある場合があります。詳細と店舗への質問で確認してください。",
      },
      {
        question: "すすきのまで通わずに働けますか？",
        answer:
          "手稲エリアの公開中求人から探せます。通勤手段と勤務時間が合うかは求人ごとに確認が必要です。",
      },
      {
        question: "送迎や車通勤の求人はありますか？",
        answer:
          "送迎ありなどの待遇が登録されている求人をタグから探せます。駐車場の有無や送迎範囲は店舗確認が必要です。",
      },
      {
        question: "地域密着型とはどういう意味ですか？",
        answer:
          "常連さんとの会話や近隣からの通いやすさを重視した店舗が多い、という意味で使っています。店舗ごとに雰囲気は異なります。",
      },
      {
        question: "求人が0件のときはどうすればよいですか？",
        answer:
          "公開中求人がない時期もあります。すすきのや琴似など他エリアのページや求人一覧から比較してください。",
      },
    ],
    columnLinks: [
      {
        label: "お酒が飲めなくても働ける夜職はある？",
        href: "/column/no-alcohol-night-job",
      },
      { label: "夜職の体験入店で確認するポイント", href: "/column/trial-work-checklist" },
      { label: "初めての方へ", href: "/first-time-guide" },
    ],
    jobTypePages: teineJobTypes,
  },
];

export function getDistrictAreaPage(slug: string): DistrictAreaPage | undefined {
  return DISTRICT_AREA_PAGES.find((page) => page.slug === slug);
}

export function getDistrictJobTypePage(
  areaSlug: string,
  jobTypeSlug: string,
): { area: DistrictAreaPage; jobTypePage: DistrictJobTypePage } | undefined {
  const area = getDistrictAreaPage(areaSlug);
  if (!area) return undefined;
  const jobTypePage = area.jobTypePages.find((page) => page.slug === jobTypeSlug);
  if (!jobTypePage) return undefined;
  return { area, jobTypePage };
}

export function buildDistrictBenefitLinks(district: District) {
  return benefitLinks(district);
}

/** Related SEO area links for footers / cross-linking. */
export const DISTRICT_SEO_RELATED_LINKS = [
  { label: "すすきのの夜職求人", href: "/sapporo/susukino" },
  { label: "琴似の夜職求人", href: "/sapporo/kotoni" },
  { label: "北24条の夜職求人", href: "/sapporo/kita24jo" },
  { label: "手稲の夜職求人", href: "/sapporo/teine" },
  { label: "札幌の求人一覧を見る", href: "/jobs" },
] as const;

export function jobTypeSlugFromJobType(jobType: JobType): DistrictJobTypeSlug | null {
  const found = JOB_TYPE_META.find((item) => item.jobType === jobType);
  return found?.slug ?? null;
}
