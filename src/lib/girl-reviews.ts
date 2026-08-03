import type {
  GirlReview,
  GirlReviewCategory,
  GirlReviewCounts,
  GirlReviewInput,
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
  created_at: string;
  updated_at: string;
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

export function validateGirlReviewInput(
  raw: unknown,
): { ok: true; value: GirlReviewInput } | { ok: false; message: string } {
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

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "星評価は1〜5で選択してください。" };
  }

  const nickname = String(body.nickname ?? "").trim();
  if (!nickname) {
    return { ok: false, message: "あだ名は必須です。" };
  }
  if (nickname.length > 40) {
    return { ok: false, message: "あだ名は40文字以内にしてください。" };
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
      message: "感じたことは20〜500文字で入力してください。",
    };
  }

  return {
    ok: true,
    value: {
      category: body.category,
      rating,
      nickname,
      age,
      comment,
    },
  };
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
