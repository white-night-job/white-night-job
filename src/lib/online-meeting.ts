/** LINE official account Basic ID for pre-contract online meeting requests. */
export const ONLINE_MEETING_LINE_ACCOUNT_ID = "@266bbynf";

export type OnlineMeetingRequestInput = {
  shopName: string;
  contactName: string;
  preferredDate: string;
  preferredTime: string;
  secondPreferredDateTime?: string;
  consultation?: string;
};

/** Format YYYY-MM-DD + HH:mm for message body (Japan-facing display). */
export function formatMeetingDateTime(date: string, time: string): string {
  const d = date.trim();
  const t = time.trim();
  if (!d || !t) return "";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return `${d} ${t}`;
  return `${y}年${Number(m)}月${Number(day)}日 ${t}`;
}

export function buildOnlineMeetingLineMessage(
  input: OnlineMeetingRequestInput,
): string {
  const first =
    formatMeetingDateTime(input.preferredDate, input.preferredTime) ||
    "未入力";
  const second = input.secondPreferredDateTime?.trim() || "未入力";
  const consultation = input.consultation?.trim() || "未入力";

  return [
    "【White Night Job】",
    "---オンライン面談---",
    "",
    `店舗名：${input.shopName.trim()}`,
    `ご担当者名：${input.contactName.trim()}`,
    `第1希望日時：${first}`,
    `第2希望日時：${second}`,
    `ご相談内容：${consultation}`,
    "",
    "オンライン面談を希望しております。",
    "よろしくお願いいたします。",
  ].join("\n");
}

/**
 * LINE oaMessage deep link — opens OA chat with text prefilled when supported.
 * Format: https://line.me/R/oaMessage/%40id/?{encoded message}
 * (Do not use ?text= — some LINE clients include the literal "text=" in the compose box.)
 * Prefill is not guaranteed on every device; callers should also offer copy fallback.
 */
export function buildOnlineMeetingLineChatUrl(
  message: string,
  officialAccountId: string = ONLINE_MEETING_LINE_ACCOUNT_ID,
): string {
  const id = officialAccountId.startsWith("@")
    ? officialAccountId
    : `@${officialAccountId}`;
  return `https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(message)}`;
}

/** Today's date in local timezone as YYYY-MM-DD (for date input min). */
export function getLocalDateInputMin(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
