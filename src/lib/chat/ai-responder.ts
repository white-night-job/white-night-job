import OpenAI from "openai";
import { CHAT_SYSTEM_PROMPT } from "./system-prompt";

export type ChatCompletionMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_MODEL = "gpt-4o-mini";

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function createOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function generateChatReply(
  messages: ChatCompletionMessage[],
): Promise<string> {
  const client = createOpenAiClient();

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 800,
  });

  const reply = response.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Empty response from OpenAI");
  }

  return reply;
}
