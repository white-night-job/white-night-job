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
  const first = formatMeetingDateTime(
    input.preferredDate,
    input.preferredTime,
  );
  const second = input.secondPreferredDateTime?.trim() || "なし";
  const consultation = input.consultation?.trim() || "なし";

  return [
    "【オンライン面談】",
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
 * Opens the official account talk / friend screen by Basic ID.
 * Message is not auto-sent — callers copy to clipboard and ask the user to paste.
 */
export function buildOnlineMeetingLineChatUrl(
  officialAccountId: string = ONLINE_MEETING_LINE_ACCOUNT_ID,
): string {
  const id = officialAccountId.startsWith("@")
    ? officialAccountId
    : `@${officialAccountId}`;
  return `https://line.me/R/ti/p/${id}`;
}

/** Today's date in local timezone as YYYY-MM-DD (for date input min). */
export function getLocalDateInputMin(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
