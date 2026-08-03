export const GIRL_REVIEW_CATEGORIES = ["interview", "cast"] as const;

export type GirlReviewCategory = (typeof GIRL_REVIEW_CATEGORIES)[number];

export const GIRL_REVIEW_CATEGORY_LABELS: Record<GirlReviewCategory, string> = {
  interview: "面接・体験入店",
  cast: "在籍キャスト",
};

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

export type GirlReviewInput = {
  category: GirlReviewCategory;
  rating: number;
  nickname: string;
  age: number;
  comment: string;
};

export type GirlReviewCounts = {
  interview: number;
  cast: number;
  total: number;
};
