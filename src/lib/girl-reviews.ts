import type {
  AdminGirlReview,
  GirlReview,
  GirlReviewCategory,
  GirlReviewContentInput,
  GirlReviewCounts,
} from "@/types/girl-review";
import { GIRL_REVIEW_CATEGORIES } from "@/types/girl-review";

export type GirlReviewRow = {
  id: string;
  job_id: string;
  category: string;
  rating: number;
  nickname: string;
  age: number;
  comment: string;
  ai_rating?: number | null;
  ai_rating_reason?: string | null;
  created_at: string;
  updated_at: string;
  jobs?: { shop_name?: string | null } | null;
};

export function isGirlReviewCategory(value: unknown): value is GirlReviewCategory {
  return (
    typeof value === "string" &&
    (GIRL_REVIEW_CATEGORIES as readonly string[]).includes(value)
  );
}

export function rowToGirlReview(row: GirlReviewRow): GirlReview {
  return {
    id: row.id,
    jobId: row.job_id,
    category: isGirlReviewCategory(row.category) ? row.category : "cast",
    rating: Number(row.rating),
    nickname: row.nickname,
    age: Number(row.age),
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToAdminGirlReview(row: GirlReviewRow): AdminGirlReview {
  return {
    ...rowToGirlReview(row),
    jobShopName: row.jobs?.shop_name?.trim() || null,
    aiRating:
      row.ai_rating == null || Number.isNaN(Number(row.ai_rating))
        ? null
        : Number(row.ai_rating),
    aiRatingReason: row.ai_rating_reason?.trim() || null,
  };
}

export function validateGirlReviewContentInput(
  raw: unknown,
): { ok: true; value: GirlReviewContentInput } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "入力内容が不正です。" };
  }
  const body = raw as Record<string, unknown>;

  if (!isGirlReviewCategory(body.category)) {
    return {
      ok: false,
      message: "口コミ区分を選択してください。",
    };
  }

  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return { ok: false, message: "ニックネームは必須です。" };
  }
  if (nickname.length > 40) {
    return { ok: false, message: "ニックネームは40文字以内にしてください。" };
  }

  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 18 || age > 80) {
    return { ok: false, message: "年齢は18歳以上で入力してください。" };
  }

  const comment = String(body.comment ?? "").trim();
  const commentLen = [...comment].length;
  if (commentLen < 20 || commentLen > 500) {
    return {
      ok: false,
      message: "口コミ内容は20〜500文字で入力してください。",
    };
  }

  return {
    ok: true,
    value: {
      category: body.category,
      nickname,
      age,
      comment,
    },
  };
}

/** @deprecated Use validateGirlReviewContentInput */
export function validateGirlReviewInput(raw: unknown) {
  return validateGirlReviewContentInput(raw);
}

export function countGirlReviewsByCategory(
  reviews: GirlReview[],
): GirlReviewCounts {
  const interview = reviews.filter((r) => r.category === "interview").length;
  const cast = reviews.filter((r) => r.category === "cast").length;
  return { interview, cast, total: reviews.length };
}

export function formatStarRating(rating: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}
