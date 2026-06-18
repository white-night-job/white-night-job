import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  createInitialSession,
  getWelcomeMessage,
  FAQ_QUICK_REPLIES,
  processChat,
} from "@/lib/chat/engine";
import { jobToChatJob } from "@/lib/chat-recommend-db";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { ChatSession } from "@/lib/chat/types";

export const dynamic = "force-dynamic";

async function fetchPublishedChatJobs() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("published", true);

  if (error) throw error;
  return (data ?? []).map((row) => jobToChatJob(rowToJob(row)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      session?: ChatSession;
      action?: "start_recommend";
    };

    const message = body.message ?? "";
    const session = body.session ?? createInitialSession();
    const jobs = await fetchPublishedChatJobs();

    const result = processChat({
      message,
      session,
      action: body.action,
      jobs,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "チャットの処理に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    reply: getWelcomeMessage(),
    session: createInitialSession(),
    quickReplies: FAQ_QUICK_REPLIES,
  });
}
