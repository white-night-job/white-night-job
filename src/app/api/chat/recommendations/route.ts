import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { LINE_GUIDANCE } from "@/lib/chat/faq-responder";
import {
  matchRecommendations,
  preferencesFromQuery,
} from "@/lib/chat/recommendations";
import { jobToChatJob } from "@/lib/chat-recommend-db";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferences = preferencesFromQuery(searchParams);
    const message = searchParams.get("message") ?? "";

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("published", true);

    if (error) throw error;

    const jobs = (data ?? []).map((row) => jobToChatJob(rowToJob(row)));
    const recommendations = matchRecommendations(jobs, preferences, message);
    const limit = Number(searchParams.get("limit") ?? "5");
    const limited = recommendations.slice(0, Math.min(limit, 10));

    return NextResponse.json({
      recommendations: limited,
      count: limited.length,
      message:
        limited.length > 0
          ? `${limited.length}件のおすすめ店舗が見つかりました。${LINE_GUIDANCE}`
          : `条件に合うおすすめ店舗が見つかりませんでした。${LINE_GUIDANCE}`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "おすすめ店舗の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
