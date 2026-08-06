import type { AdminNotificationRecord } from "@/lib/admin-notifications";

export type AdminNotificationUiType =
  | "stripe_new_contract"
  | "stripe_invoice_paid"
  | "stripe_payment_failed"
  | "stripe_canceled"
  | "system"
  | string;

export function getNotificationTypeMeta(type: string): {
  emoji: string;
  label: string;
  tone: "red" | "green" | "orange" | "gray" | "blue";
} {
  switch (type) {
    case "stripe_new_contract":
      return { emoji: "🔴", label: "新規契約", tone: "red" };
    case "stripe_invoice_paid":
      return { emoji: "🟢", label: "定期決済成功", tone: "green" };
    case "stripe_payment_failed":
      return { emoji: "🟠", label: "決済失敗", tone: "orange" };
    case "stripe_canceled":
      return { emoji: "⚫", label: "解約", tone: "gray" };
    case "system":
      return { emoji: "🔵", label: "システム通知", tone: "blue" };
    default:
      return { emoji: "⚪", label: "通知", tone: "gray" };
  }
}

function extractTaggedLine(message: string, tag: string): string | null {
  const line = message
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${tag}：`) || part.startsWith(`${tag}:`));
  if (!line) return null;
  return line.replace(new RegExp(`^${tag}[:：]\\s*`), "").trim() || null;
}

export function getNotificationShopName(
  item: Pick<AdminNotificationRecord, "shopName" | "message">,
): string {
  if (item.shopName?.trim()) return item.shopName.trim();
  return extractTaggedLine(item.message, "店舗名") ?? "店舗名未設定";
}

export function getNotificationSummary(
  item: Pick<AdminNotificationRecord, "type" | "message" | "title">,
): string {
  const tagged = extractTaggedLine(item.message, "要約");
  if (tagged) return tagged;

  switch (item.type) {
    case "stripe_new_contract": {
      const plan = extractTaggedLine(item.message, "プラン");
      return plan ? `${plan}契約` : "新規契約";
    }
    case "stripe_invoice_paid": {
      const amount = extractTaggedLine(item.message, "金額");
      return amount ?? "定期決済完了";
    }
    case "stripe_payment_failed":
      return "カード決済失敗";
    case "stripe_canceled": {
      const plan = extractTaggedLine(item.message, "プラン");
      return plan ? `${plan}解約` : "解約";
    }
    case "system":
      return item.title || "システム通知";
    default:
      return item.title || "通知";
  }
}

export function formatRelativeTimeJa(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "たった今";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "昨日";
  if (diffDay < 7) return `${diffDay}日前`;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
