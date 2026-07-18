import type { Job } from "@/types/job";
import type { ChatJob } from "./chat/types";

export type ChatRecommendSettings = {
  enabled: boolean;
  priority: number;
  comment?: string;
  beginner: boolean;
  noAlcoholOk: boolean;
  shuttle: boolean;
  privacy: boolean;
  highSalary: boolean;
  relaxed: boolean;
  highEarning: boolean;
};

type ChatRecommendRow = {
  chat_recommend_enabled?: boolean | null;
  chat_recommend_priority?: number | null;
  chat_recommend_comment?: string | null;
  chat_recommend_beginner?: boolean | null;
  chat_recommend_no_alcohol_ok?: boolean | null;
  chat_recommend_shuttle?: boolean | null;
  chat_recommend_privacy?: boolean | null;
  chat_recommend_high_salary?: boolean | null;
  chat_recommend_relaxed?: boolean | null;
  chat_recommend_high_earning?: boolean | null;
};

export function rowToChatRecommend(row: ChatRecommendRow): ChatRecommendSettings {
  return {
    enabled: row.chat_recommend_enabled ?? true,
    priority: row.chat_recommend_priority ?? 0,
    comment: row.chat_recommend_comment?.trim() || undefined,
    beginner: row.chat_recommend_beginner ?? false,
    noAlcoholOk: row.chat_recommend_no_alcohol_ok ?? false,
    shuttle: row.chat_recommend_shuttle ?? false,
    privacy: row.chat_recommend_privacy ?? false,
    highSalary: row.chat_recommend_high_salary ?? false,
    relaxed: row.chat_recommend_relaxed ?? false,
    highEarning: row.chat_recommend_high_earning ?? false,
  };
}

export function jobToChatJob(job: Job): ChatJob {
  const chat = job.chatRecommend ?? rowToChatRecommend({});
  return {
    id: job.id,
    shopName: job.shopName,
    area: job.area,
    district: job.district,
    jobType: job.jobType,
    salary: job.salary,
    lineUrl: job.lineUrl,
    imageUrl: job.imageUrl,
    postedAt: job.postedAt,
    benefits: [...job.benefits, ...(job.otherBenefits ?? [])],
    chatRecommend: chat,
  };
}

export function parseChatRecommendFromBody(
  body: Record<string, unknown>,
): Partial<ChatRecommendSettings> {
  const source =
    (body.chatRecommend as Record<string, unknown> | undefined) ?? body;
  const parsed: Partial<ChatRecommendSettings> = {};

  const enabled = source.chat_recommend_enabled ?? source.enabled;
  if (enabled !== undefined) parsed.enabled = Boolean(enabled);

  const priority = source.chat_recommend_priority ?? source.priority;
  if (priority !== undefined) parsed.priority = Number(priority) || 0;

  // Comment / tags are no longer editable — AI uses benefits and job text.
  return parsed;
}

export function chatRecommendToRow(
  settings: Partial<ChatRecommendSettings>,
): Record<string, boolean | number | string | null> {
  const row: Record<string, boolean | number | string | null> = {};

  if (settings.enabled !== undefined) {
    row.chat_recommend_enabled = settings.enabled;
  }
  if (settings.priority !== undefined) {
    row.chat_recommend_priority = settings.priority;
  }

  return row;
}
