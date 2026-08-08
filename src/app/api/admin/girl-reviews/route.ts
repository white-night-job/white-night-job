import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { listAdminGirlReviews } from "@/lib/girl-reviews-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId")?.trim() || undefined;
    const limitRaw = Number(searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 100;
    const reviews = await listAdminGirlReviews({ jobId, limit });
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "口コミ一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
