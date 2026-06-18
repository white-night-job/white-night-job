import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  generateChatReply,
  isOpenAiConfigured,
  type ChatCompletionMessage,
} from "@/lib/chat/ai-responder";
import {
  extractPreferencesFromMessages,
  preferencesToSearchText,
  shouldIncludeRecommendations,
} from "@/lib/chat/preference-extractor";
import { matchRecommendations } from "@/lib/chat/recommendations";
import { jobToChatJob } from "@/lib/chat-recommend-db";
import type { ChatApiMessage, ChatApiResponse } from "@/lib/chat/types";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 30;
const UNCONFIGURED_REPLY = "現在チャット機能の準備中です";
const ERROR_REPLY =
  "うまく回答できませんでした。時間をおいてもう一度お試しください";

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

  return messages
    .filter(
      (message): message is ChatApiMessage =>
        Boolean(message) &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES);
}

function toCompletionMessages(messages: ChatApiMessage[]): ChatCompletionMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = sanitizeMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { message: "メッセージを入力してください。" },
        { status: 400 },
      );
    }

    if (!isOpenAiConfigured()) {
      const response: ChatApiResponse = {
        reply: UNCONFIGURED_REPLY,
        recommendations: [],
      };
      return NextResponse.json(response);
    }

    const jobs = await fetchPublishedChatJobs();
    const completionMessages = toCompletionMessages(messages);

    let reply: string;
    try {
      reply = await generateChatReply(completionMessages);
    } catch (error) {
      console.error("OpenAI chat failed:", error);
      const response: ChatApiResponse = {
        reply: ERROR_REPLY,
        recommendations: [],
      };
      return NextResponse.json(response);
    }

    const prefs = extractPreferencesFromMessages(messages);
    const searchText = preferencesToSearchText(messages);
    const recommendations = shouldIncludeRecommendations(messages, prefs)
      ? matchRecommendations(jobs, prefs, searchText, 5)
      : [];

    const response: ChatApiResponse = {
      reply,
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "チャットの処理に失敗しました。") },
      { status: 500 },
    );
  }
}
