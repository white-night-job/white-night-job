import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  generateChatReply,
  isOpenAiConfigured,
  type ChatCompletionMessage,
} from "@/lib/chat/ai-responder";
import type { ChatApiMessage, ChatApiResponse } from "@/lib/chat/types";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 30;
const UNCONFIGURED_REPLY = "現在チャット機能の準備中です";
const ERROR_REPLY =
  "うまく回答できませんでした。時間をおいてもう一度お試しください";

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

function sanitizeSelectedAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return [];
  return areas
    .map((area) => String(area).trim())
    .filter((area) => area.length > 0);
}

function toCompletionMessages(
  messages: ChatApiMessage[],
  selectedAreas: string[],
): ChatCompletionMessage[] {
  const completionMessages = messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));

  if (selectedAreas.length > 0) {
    return [
      {
        role: "user" as const,
        content: `（システム情報：ユーザーが選択した希望エリアは「${selectedAreas.join("、")}」です。このエリアを前提に回答してください。）`,
      },
      {
        role: "assistant" as const,
        content: "承知しました。選択エリアを踏まえてご案内します。",
      },
      ...completionMessages,
    ];
  }

  return completionMessages;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
    }

    const body = (await request.json()) as {
      messages?: unknown;
      selectedAreas?: unknown;
    };
    const messages = sanitizeMessages(body.messages);
    const selectedAreas = sanitizeSelectedAreas(body.selectedAreas);

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

    const completionMessages = toCompletionMessages(messages, selectedAreas);

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

    const response: ChatApiResponse = {
      reply,
      recommendations: [],
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "チャットの処理に失敗しました。") },
      { status: 500 },
    );
  }
}
