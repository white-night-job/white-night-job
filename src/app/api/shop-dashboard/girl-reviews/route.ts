import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  createGirlReview,
  listGirlReviewsForJob,
} from "@/lib/girl-reviews-db";
import { validateGirlReviewContentInput } from "@/lib/girl-reviews";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const reviews = await listGirlReviewsForJob(jobId);
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "口コミの取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // 店舗・投稿者からの星評価は受け付けない（サーバ側でAI判定）
    if (body && typeof body === "object" && "rating" in body) {
      delete (body as { rating?: unknown }).rating;
    }
    const validated = validateGirlReviewContentInput(body);
    if (!validated.ok) {
      return NextResponse.json({ message: validated.message }, { status: 400 });
    }

    const review = await createGirlReview(jobId, validated.value);
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "口コミの登録に失敗しました。") },
      { status: 500 },
    );
  }
}
