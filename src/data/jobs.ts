import { shops, type ShopId } from "./shops";
import { FIXED_AREA, type Job, type JobEntry } from "@/types/job";

export const jobEntries: JobEntry[] = [
  {
    id: "7",
    shopId: "sapporo-rosetta",
    title: "未経験歓迎｜すすきのニュークラキャスト",
    area: FIXED_AREA,
    district: "すすきの",
    jobType: "ニュークラ",
    salary: "時給 4,000円〜",
    workHours: "20:00〜LAST",
    introductionText:
      "すすきのエリアの人気ニュークラブ。北海道初出勤の方も歓迎。",
    descriptionText:
      "すすきのエリアの人気ニュークラブ。北海道初出勤の方も歓迎。ヘアメイク・ドレスは店内完備。",
    requirements: ["20歳以上", "週2日〜OK"],
    benefits: ["送迎あり", "衣装・美容サポート", "ノルマなし"],
    isVerified: true,
    imageUrl: "",
    postedAt: "2026-05-19",
  },
  {
    id: "8",
    shopId: "sapporo-aurora",
    title: "高時給｜ニュークラホールスタッフ兼キャスト",
    area: FIXED_AREA,
    district: "すすきの",
    jobType: "ニュークラ",
    salary: "時給 4,500円〜",
    workHours: "19:30〜LAST",
    introductionText:
      "落ち着いた雰囲気の高級ニュークラブ。接客・ホールからスタート可能。",
    descriptionText:
      "落ち着いた雰囲気の高級ニュークラブ。接客・ホールからスタートしキャストデビューも可能。",
    requirements: ["20歳以上", "土金勤務できる方"],
    benefits: ["まかないあり", "交通費支給", "昇給あり"],
    isVerified: true,
    imageUrl: "",
    postedAt: "2026-05-18",
  },
  {
    id: "9",
    shopId: "sapporo-blanc",
    title: "週1〜OK｜札幌ニュークラ体験入店歓迎",
    area: FIXED_AREA,
    district: "すすきの",
    jobType: "ニュークラ",
    salary: "日給 12,000円〜",
    workHours: "21:00〜01:00",
    introductionText: "学生・Wワーク歓迎。体験入店1日から可能。",
    descriptionText:
      "学生・Wワーク歓迎。体験入店1日から可能。シフトは自由に相談できます。",
    requirements: ["20歳以上", "週1日〜OK"],
    benefits: ["体験入店OK", "週払い可", "私服出勤相談可"],
    isVerified: false,
    imageUrl: "",
    postedAt: "2026-05-17",
  },
  {
    id: "2",
    shopId: "lumiere",
    title: "週1からOK｜ガールズバースタッフ",
    area: FIXED_AREA,
    district: "琴似",
    jobType: "ガールズバー",
    salary: "時給 3,500円〜",
    workHours: "19:00〜24:00",
    introductionText: "カジュアルな雰囲気のバー。学生・Wワーク歓迎。",
    descriptionText: "カジュアルな雰囲気のバー。学生・Wワーク歓迎。",
    requirements: ["18歳以上", "週1日〜OK"],
    benefits: ["まかないあり", "交通費支給"],
    isVerified: true,
    imageUrl: "",
    postedAt: "2026-05-17",
  },
  {
    id: "3",
    shopId: "prestige",
    title: "経験者優遇｜ラウンジスタッフ",
    area: FIXED_AREA,
    district: "24条",
    jobType: "ラウンジ",
    salary: "月給 35万円〜",
    workHours: "18:00〜02:00",
    introductionText: "落ち着いた雰囲気のラウンジ。接客経験者を優遇。",
    descriptionText: "落ち着いた雰囲気のラウンジ。接客経験者を優遇。",
    requirements: ["接客経験1年以上"],
    benefits: ["社会保険完備", "有給休暇"],
    isVerified: false,
    imageUrl: "",
    postedAt: "2026-05-15",
  },
  {
    id: "4",
    shopId: "snack-hana",
    title: "ママ・スタッフ募集｜アットホームなスナック",
    area: FIXED_AREA,
    district: "手稲",
    jobType: "スナック",
    salary: "日給 8,000円〜",
    workHours: "20:00〜01:00",
    introductionText: "常連さん中心の温かいお店。",
    descriptionText: "常連さん中心の温かいお店。",
    requirements: ["20歳以上"],
    benefits: ["ノルマなし", "送迎あり"],
    isVerified: true,
    imageUrl: "",
    postedAt: "2026-05-14",
  },
];

function toJob(entry: JobEntry): Job {
  const shop = shops[entry.shopId];
  return {
    ...entry,
    shopName: shop.name,
    lineUrl: shop.lineUrl,
  };
}

export const jobs: Job[] = jobEntries.map(toJob);

export function getJobById(id: string): Job | undefined {
  return jobs.find((job) => job.id === id);
}

export function getJobsByShop(shopId: ShopId): Job[] {
  return jobs.filter((job) => job.shopId === shopId);
}
