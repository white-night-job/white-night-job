import { evaluateGirlReviewRating } from "@/lib/girl-review-ai-rating";
import {
  countGirlReviewsByCategory,
  rowToAdminGirlReview,
  rowToGirlReview,
  type GirlReviewRow,
} from "@/lib/girl-reviews";
import { createSupabaseAdmin } from "@/lib/supabase";
import type {
  AdminGirlReview,
  GirlReview,
  GirlReviewContentInput,
  GirlReviewCounts,
} from "@/types/girl-review";

const SELECT_COLUMNS =
  "id, job_id, category, rating, nickname, age, comment, ai_rating, ai_rating_reason, created_at, updated_at";

const ADMIN_SELECT_COLUMNS = `${SELECT_COLUMNS}, jobs(shop_name)`;

export async function listGirlReviewsForJob(
  jobId: string,
): Promise<GirlReview[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .select(SELECT_COLUMNS)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as GirlReviewRow[]).map(rowToGirlReview);
}

export async function getGirlReviewCountsForJob(
  jobId: string,
): Promise<GirlReviewCounts> {
  const reviews = await listGirlReviewsForJob(jobId);
  return countGirlReviewsByCategory(reviews);
}

export async function getGirlReviewByIdForJob(
  jobId: string,
  reviewId: string,
): Promise<GirlReview | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .select(SELECT_COLUMNS)
    .eq("id", reviewId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToGirlReview(data as GirlReviewRow);
}

export async function createGirlReview(
  jobId: string,
  input: GirlReviewContentInput,
): Promise<GirlReview> {
  const evaluated = await evaluateGirlReviewRating(input.comment);
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .insert({
      job_id: jobId,
      category: input.category,
      rating: evaluated.rating,
      ai_rating: evaluated.aiRating,
      ai_rating_reason: evaluated.reason,
      nickname: input.nickname,
      age: input.age,
      comment: input.comment,
      migrated_from_cast_voice: false,
      created_at: now,
      updated_at: now,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToGirlReview(data as GirlReviewRow);
}

/**
 * 店舗向け更新。星評価はクライアントから受け付けず、
 * 本文変更時のみ AI 再評価する。
 */
export async function updateGirlReviewContent(
  jobId: string,
  reviewId: string,
  input: GirlReviewContentInput,
): Promise<GirlReview | null> {
  const existing = await getGirlReviewByIdForJob(jobId, reviewId);
  if (!existing) return null;

  const commentChanged = existing.comment.trim() !== input.comment.trim();
  const evaluated = commentChanged
    ? await evaluateGirlReviewRating(input.comment)
    : null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .update({
      category: input.category,
      nickname: input.nickname,
      age: input.age,
      comment: input.comment,
      ...(evaluated
        ? {
            rating: evaluated.rating,
            ai_rating: evaluated.aiRating,
            ai_rating_reason: evaluated.reason,
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("job_id", jobId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToGirlReview(data as GirlReviewRow);
}

/** @deprecated Use updateGirlReviewContent */
export async function updateGirlReview(
  jobId: string,
  reviewId: string,
  input: GirlReviewContentInput,
): Promise<GirlReview | null> {
  return updateGirlReviewContent(jobId, reviewId, input);
}

export async function deleteGirlReview(
  jobId: string,
  reviewId: string,
): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("job_id", jobId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function listAdminGirlReviews(options?: {
  limit?: number;
  jobId?: string;
}): Promise<AdminGirlReview[]> {
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 300);
  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("job_girl_reviews")
    .select(ADMIN_SELECT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.jobId) {
    query = query.eq("job_id", options.jobId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as GirlReviewRow[]).map(rowToAdminGirlReview);
}

/** 運営のみ：公開星評価を手動修正（AI判定理由は保持） */
export async function updateAdminGirlReviewRating(
  reviewId: string,
  rating: number,
): Promise<AdminGirlReview | null> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("星評価は1〜5で指定してください。");
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .update({
      rating,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: withJob, error: joinError } = await supabase
    .from("job_girl_reviews")
    .select(ADMIN_SELECT_COLUMNS)
    .eq("id", reviewId)
    .maybeSingle();

  if (joinError) throw joinError;
  return rowToAdminGirlReview((withJob ?? data) as GirlReviewRow);
}
