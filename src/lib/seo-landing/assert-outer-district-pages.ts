import { getDistrictComparisonListing } from "@/lib/district-comparison-listing";
import { getPublishedSeoLanding } from "@/lib/seo-landing/build";

export const OUTER_DISTRICT_SEO_PAGES = [
  {
    area: "kotoni",
    jobType: "girlsbar",
    areaName: "琴似",
    jobName: "ガールズバー",
    path: "/sapporo/kotoni/girlsbar",
    title: "琴似のガールズバー・ガルバ求人｜White Night Job",
    h1: "琴似のガールズバー・ガルバ求人",
    description:
      "琴似のガールズバー求人・ガルバ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・通勤のしやすさから比較できます。",
    girlsBar301: true,
  },
  {
    area: "kotoni",
    jobType: "concept-cafe",
    areaName: "琴似",
    jobName: "コンカフェ",
    path: "/sapporo/kotoni/concept-cafe",
    title: "琴似のコンカフェ求人｜White Night Job",
    h1: "琴似のコンカフェ求人",
    description:
      "琴似のコンカフェ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・指定衣装の負担から比較できます。",
    girlsBar301: false,
  },
  {
    area: "kotoni",
    jobType: "snack",
    areaName: "琴似",
    jobName: "スナック",
    path: "/sapporo/kotoni/snack",
    title: "琴似のスナック求人｜White Night Job",
    h1: "琴似のスナック求人",
    description:
      "琴似のスナック求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・常連さんとの距離感から比較できます。",
    girlsBar301: false,
  },
  {
    area: "kotoni",
    jobType: "lounge",
    areaName: "琴似",
    jobName: "ラウンジ",
    path: "/sapporo/kotoni/lounge",
    title: "琴似のラウンジ求人｜White Night Job",
    h1: "琴似のラウンジ求人",
    description:
      "琴似のラウンジ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・席での距離感から比較できます。",
    girlsBar301: false,
  },
  {
    area: "kotoni",
    jobType: "new-club",
    areaName: "琴似",
    jobName: "ニュークラ",
    path: "/sapporo/kotoni/new-club",
    title: "琴似のニュークラ求人｜White Night Job",
    h1: "琴似のニュークラ求人",
    description:
      "琴似のニュークラ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・ドレスの準備から比較できます。",
    girlsBar301: false,
  },
  {
    area: "kita24jo",
    jobType: "girlsbar",
    areaName: "北24条",
    jobName: "ガールズバー",
    path: "/sapporo/kita24jo/girlsbar",
    title: "北24条のガールズバー・ガルバ求人｜White Night Job",
    h1: "北24条のガールズバー・ガルバ求人",
    description:
      "北24条のガールズバー求人・ガルバ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・南北線での通いやすさから比較できます。",
    girlsBar301: true,
  },
  {
    area: "kita24jo",
    jobType: "concept-cafe",
    areaName: "北24条",
    jobName: "コンカフェ",
    path: "/sapporo/kita24jo/concept-cafe",
    title: "北24条のコンカフェ求人｜White Night Job",
    h1: "北24条のコンカフェ求人",
    description:
      "北24条のコンカフェ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・通学帰りに合うシフトから比較できます。",
    girlsBar301: false,
  },
  {
    area: "kita24jo",
    jobType: "snack",
    areaName: "北24条",
    jobName: "スナック",
    path: "/sapporo/kita24jo/snack",
    title: "北24条のスナック求人｜White Night Job",
    h1: "北24条のスナック求人",
    description:
      "北24条のスナック求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・地元客との距離感から比較できます。",
    girlsBar301: false,
  },
  {
    area: "kita24jo",
    jobType: "lounge",
    areaName: "北24条",
    jobName: "ラウンジ",
    path: "/sapporo/kita24jo/lounge",
    title: "北24条のラウンジ求人｜White Night Job",
    h1: "北24条のラウンジ求人",
    description:
      "北24条のラウンジ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・静かめの接客テンポから比較できます。",
    girlsBar301: false,
  },
  {
    area: "kita24jo",
    jobType: "new-club",
    areaName: "北24条",
    jobName: "ニュークラ",
    path: "/sapporo/kita24jo/new-club",
    title: "北24条のニュークラ求人｜White Night Job",
    h1: "北24条のニュークラ求人",
    description:
      "北24条のニュークラ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・席接客の密度から比較できます。",
    girlsBar301: false,
  },
  {
    area: "teine",
    jobType: "girlsbar",
    areaName: "手稲",
    jobName: "ガールズバー",
    path: "/sapporo/teine/girlsbar",
    title: "手稲のガールズバー・ガルバ求人｜White Night Job",
    h1: "手稲のガールズバー・ガルバ求人",
    description:
      "手稲のガールズバー求人・ガルバ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・JRでの帰宅から比較できます。",
    girlsBar301: true,
  },
  {
    area: "teine",
    jobType: "concept-cafe",
    areaName: "手稲",
    jobName: "コンカフェ",
    path: "/sapporo/teine/concept-cafe",
    title: "手稲のコンカフェ求人｜White Night Job",
    h1: "手稲のコンカフェ求人",
    description:
      "手稲のコンカフェ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・衣装準備と帰宅の両立から比較できます。",
    girlsBar301: false,
  },
  {
    area: "teine",
    jobType: "snack",
    areaName: "手稲",
    jobName: "スナック",
    path: "/sapporo/teine/snack",
    title: "手稲のスナック求人｜White Night Job",
    h1: "手稲のスナック求人",
    description:
      "手稲のスナック求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・地域の常連さんとの距離感から比較できます。",
    girlsBar301: false,
  },
  {
    area: "teine",
    jobType: "lounge",
    areaName: "手稲",
    jobName: "ラウンジ",
    path: "/sapporo/teine/lounge",
    title: "手稲のラウンジ求人｜White Night Job",
    h1: "手稲のラウンジ求人",
    description:
      "手稲のラウンジ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・落ち着いた席接客から比較できます。",
    girlsBar301: false,
  },
  {
    area: "teine",
    jobType: "new-club",
    areaName: "手稲",
    jobName: "ニュークラ",
    path: "/sapporo/teine/new-club",
    title: "手稲のニュークラ求人｜White Night Job",
    h1: "手稲のニュークラ求人",
    description:
      "手稲のニュークラ求人を探すならWhite Night Job。未経験から相談しやすい店舗や体験入店の案内がある求人を、時給・勤務条件・ドレス準備と帰宅の両立から比較できます。",
    girlsBar301: false,
  },
] as const;

export function assertOuterDistrictPages(): string[] {
  const errors: string[] = [];
  const descriptions = new Set<string>();
  const intros = new Set<string>();
  const faqHeads = new Set<string>();

  if (OUTER_DISTRICT_SEO_PAGES.length !== 15) {
    errors.push(`expected 15 pages, got ${OUTER_DISTRICT_SEO_PAGES.length}`);
  }

  for (const spec of OUTER_DISTRICT_SEO_PAGES) {
    const landing = getPublishedSeoLanding(spec.area, spec.jobType);
    const name = `${spec.area}/${spec.jobType}`;
    if (!landing) {
      errors.push(`${name}: missing landing`);
      continue;
    }
    if (landing.path !== spec.path) {
      errors.push(`${name}: path ${landing.path} !== ${spec.path}`);
    }
    if (landing.title !== spec.title) errors.push(`${name}: title mismatch`);
    if (landing.h1 !== spec.h1) errors.push(`${name}: h1 mismatch`);
    if (landing.description !== spec.description) {
      errors.push(`${name}: description mismatch`);
    }
    if (!landing.listLinkLabel) errors.push(`${name}: missing listLinkLabel`);
    if (!landing.faqs.length) errors.push(`${name}: missing FAQs`);
    if (!landing.contentSections.length) {
      errors.push(`${name}: missing contentSections`);
    }
    if (!getDistrictComparisonListing(spec.area, spec.jobType)) {
      errors.push(`${name}: missing comparison listing`);
    }

    descriptions.add(landing.description);
    intros.add(landing.intro[0] ?? "");
    faqHeads.add(landing.faqs[0]?.question ?? "");
  }

  if (descriptions.size !== 15) {
    errors.push(`duplicate descriptions: ${descriptions.size}/15 unique`);
  }
  if (intros.size !== 15) {
    errors.push(`duplicate intro[0]: ${intros.size}/15 unique`);
  }
  if (faqHeads.size !== 15) {
    errors.push(`duplicate first FAQ: ${faqHeads.size}/15 unique`);
  }

  return errors;
}
