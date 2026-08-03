import {
  countGirlReviewsByCategory,
  rowToGirlReview,
  type GirlReviewRow,
} from "@/lib/girl-reviews";
import { createSupabaseAdmin } from "@/lib/supabase";
import type {
  GirlReview,
  GirlReviewCounts,
  GirlReviewInput,
} from "@/types/girl-review";

const SELECT_COLUMNS =
  "id, job_id, category, rating, nickname, age, comment, created_at, updated_at";

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

export async function createGirlReview(
  jobId: string,
  input: GirlReviewInput,
): Promise<GirlReview> {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .insert({
      job_id: jobId,
      category: input.category,
      rating: input.rating,
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

export async function updateGirlReview(
  jobId: string,
  reviewId: string,
  input: GirlReviewInput,
): Promise<GirlReview | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_girl_reviews")
    .update({
      category: input.category,
      rating: input.rating,
      nickname: input.nickname,
      age: input.age,
      comment: input.comment,
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
