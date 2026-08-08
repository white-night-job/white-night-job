import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { updateAdminGirlReviewRating } from "@/lib/girl-reviews-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  rating?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "口コミIDが不正です。" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as PatchBody;
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "星評価は1〜5で指定してください。" },
        { status: 400 },
      );
    }

    const review = await updateAdminGirlReviewRating(id, rating);
    if (!review) {
      return NextResponse.json({ message: "口コミが見つかりません。" }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "評価の更新に失敗しました。") },
      { status: 500 },
    );
  }
}
