import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { extractPreferencesFromMessages, preferencesToSearchText } from "@/lib/chat/preference-extractor";
import {
  matchRecommendations,
  matchRecommendationsForAreas,
  preferencesFromQuery,
} from "@/lib/chat/recommendations";
import { jobToChatJob } from "@/lib/chat-recommend-db";
import type { ChatApiMessage } from "@/lib/chat/types";
import { rowToJob } from "@/lib/job-db";
import { fetchBoostStatsForJobs } from "@/lib/shop-boosts";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const LINE_GUIDANCE =
  "気になる店舗があれば、求人ページからLINEで気軽に相談できます。";

const MAX_RECOMMENDATIONS = 10;

async function fetchPublishedChatJobs() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("published", true);

  if (error) throw error;
  return (data ?? []).map((row) => jobToChatJob(rowToJob(row)));
}

function sanitizeMessages(messages: unknown): ChatApiMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages.filter(
    (message): message is ChatApiMessage =>
      Boolean(message) &&
      typeof message === "object" &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0,
  );
}

function sanitizeSelectedAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return [];
  return areas
    .map((area) => String(area).trim())
    .filter((area) => area.length > 0);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      selectedAreas?: unknown;
      messages?: unknown;
    };

    const selectedAreas = sanitizeSelectedAreas(body.selectedAreas);
    if (selectedAreas.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "先に希望エリアを選択してください",
      });
    }

    const messages = sanitizeMessages(body.messages);
    const prefs = extractPreferencesFromMessages(messages);
    const searchText = preferencesToSearchText(messages);

    const jobs = await fetchPublishedChatJobs();
    const supabase = createSupabaseAdmin();
    const boostMap = await fetchBoostStatsForJobs(
      supabase,
      jobs.map((job) => job.id),
    );

    const recommendations = matchRecommendationsForAreas(
      jobs,
      selectedAreas,
      prefs,
      searchText,
      boostMap,
      MAX_RECOMMENDATIONS,
    );

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      message:
        recommendations.length > 0
          ? `${recommendations.length}件のおすすめ店舗が見つかりました。${LINE_GUIDANCE}`
          : `条件に合うおすすめ店舗が見つかりませんでした。エリアや条件を変えてお試しください。`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "おすすめ店舗の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferences = preferencesFromQuery(searchParams);
    const message = searchParams.get("message") ?? "";

    const jobs = await fetchPublishedChatJobs();
    const recommendations = matchRecommendations(jobs, preferences, message);
    const limit = Number(searchParams.get("limit") ?? "5");
    const limited = recommendations.slice(0, Math.min(limit, MAX_RECOMMENDATIONS));

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
