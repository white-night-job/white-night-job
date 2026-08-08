export const GIRL_REVIEW_CATEGORIES = ["interview", "cast"] as const;

export type GirlReviewCategory = (typeof GIRL_REVIEW_CATEGORIES)[number];

export const GIRL_REVIEW_CATEGORY_LABELS: Record<GirlReviewCategory, string> = {
  interview: "面接・体験入店",
  cast: "在籍キャスト",
};

/** 公開・店舗向け（星はAI/運営が付与。投稿者は入力しない） */
export type GirlReview = {
  id: string;
  jobId: string;
  category: GirlReviewCategory;
  rating: number;
  nickname: string;
  age: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

/** 運営向け（AI判定の内訳を含む） */
export type AdminGirlReview = GirlReview & {
  jobShopName: string | null;
  aiRating: number | null;
  aiRatingReason: string | null;
};

/** 店舗・投稿者が送る入力（星評価なし） */
export type GirlReviewContentInput = {
  category: GirlReviewCategory;
  nickname: string;
  age: number;
  comment: string;
};

export type GirlReviewCounts = {
  interview: number;
  cast: number;
  total: number;
};
