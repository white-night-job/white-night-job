import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { rowToJob } from "@/lib/job-db";
import { fetchListingRanksForJob } from "@/lib/shop-boosts";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Admin-only: fetch any job including draft / paused. */
export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const district = String((data as { district?: string }).district ?? "");
    let listingRanks = null;
    try {
      listingRanks = await fetchListingRanksForJob(supabase, id, district);
    } catch (rankError) {
      console.error("[admin/jobs/id] listing ranks failed", rankError);
    }

    return NextResponse.json({
      job: rowToJob(data, { includeShopLoginPassword: true }),
      listingRanks,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
