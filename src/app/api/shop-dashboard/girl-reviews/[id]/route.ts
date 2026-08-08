import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { validateGirlReviewContentInput } from "@/lib/girl-reviews";
import {
  deleteGirlReview,
  updateGirlReviewContent,
} from "@/lib/girl-reviews-db";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "口コミIDが不正です。" }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (body && typeof body === "object" && "rating" in body) {
      delete (body as { rating?: unknown }).rating;
    }
    const validated = validateGirlReviewContentInput(body);
    if (!validated.ok) {
      return NextResponse.json({ message: validated.message }, { status: 400 });
    }

    const review = await updateGirlReviewContent(jobId, id, validated.value);
    if (!review) {
      return NextResponse.json({ message: "口コミが見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "口コミの更新に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "口コミIDが不正です。" }, { status: 400 });
  }

  try {
    const deleted = await deleteGirlReview(jobId, id);
    if (!deleted) {
      return NextResponse.json({ message: "口コミが見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "口コミの削除に失敗しました。") },
      { status: 500 },
    );
  }
}
