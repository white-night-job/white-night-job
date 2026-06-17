import type { ShopId } from "@/data/shops";

export const FIXED_AREA = "札幌" as const;
export type Area = typeof FIXED_AREA;

export type District = "すすきの" | "琴似" | "24条" | "手稲";

export type CastVoiceEntry = {
  name: string;
  age: string;
  comment: string;
};

export type JobType =
  | "ガールズバー"
  | "コンカフェ"
  | "ラウンジ"
  | "ニュークラ"
  | "クラブ"
  | "スナック";

export const JOB_TYPES: JobType[] = [
  "ガールズバー",
  "コンカフェ",
  "ラウンジ",
  "ニュークラ",
  "クラブ",
  "スナック",
];

export interface JobEntry {
  id: string;
  shopId: ShopId;
  title: string;
  area: Area;
  district: District;
  jobType: JobType;
  salary: string;
  workHours: string;
  businessHours?: string;
  ageGroup?: string;
  customerPersonalityLevel?: number;
  customerAgeLevel?: number;
  customerRegularLevel?: number;
  introductionText?: string;
  descriptionText?: string;
  castVoices?: CastVoiceEntry[];
  /** @deprecated 旧テキスト形式。cast_voices が空のときの表示用 */
  castVoice?: string;
  requirements: string[];
  benefits: string[];
  otherBenefits?: string[];
  isVerified: boolean;
  imageUrl?: string;
  storeImages?: string[];
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterImage?: string;
  recruiterMessage?: string;
  phone?: string;
  address?: string;
  access?: string;
  xUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  postedAt: string;
}

export interface Job {
  id: string;
  shopId?: ShopId;
  shopName: string;
  area: Area;
  district: District;
  jobType: JobType;
  title: string;
  salary: string;
  workHours: string;
  businessHours?: string;
  ageGroup?: string;
  customerPersonalityLevel?: number;
  customerAgeLevel?: number;
  customerRegularLevel?: number;
  introductionText?: string;
  descriptionText?: string;
  castVoices?: CastVoiceEntry[];
  /** @deprecated 旧テキスト形式。cast_voices が空のときの表示用 */
  castVoice?: string;
  requirements: string[];
  benefits: string[];
  otherBenefits?: string[];
  isVerified: boolean;
  imageUrl?: string;
  storeImages?: string[];
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterImage?: string;
  recruiterMessage?: string;
  phone?: string;
  address?: string;
  access?: string;
  xUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
  lineUrl: string;
  postedAt: string;
  shopLoginId?: string;
}

export interface JobFilters {
  district: string | null;
  jobType: string | null;
  query?: string | null;
  minSalary?: string | null;
  benefits?: string[];
}
