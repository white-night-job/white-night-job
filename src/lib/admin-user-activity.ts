import { getJstMonthBounds } from "@/lib/jst-month-bounds";

export type UserActivityPeriod =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export type MetricAvailability = {
  available: boolean;
  value: number | null;
  note?: string;
};

export type UserActivityShopStat = {
  jobId: string;
  shopName: string;
  district: string | null;
  area: string | null;
  views: number;
  applyClicks: number;
};

export type UserActivityEvent = {
  id: string;
  at: string;
  feature: string;
  shopName: string | null;
  district: string | null;
  area: string | null;
  deviceType: string | null;
};

const TOKYO = "Asia/Tokyo";

function jstYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function jstDayStartIso(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T00:00:00+09:00`).toISOString();
}

function addDays(year: number, month: number, day: number, delta: number) {
  const base = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+09:00`,
  );
  base.setDate(base.getDate() + delta);
  return jstYmd(base);
}

export function parseUserActivityPeriod(
  value: string | null | undefined,
): UserActivityPeriod {
  switch (value) {
    case "today":
    case "last_7_days":
    case "last_30_days":
    case "this_month":
    case "last_month":
    case "custom":
      return value;
    default:
      return "last_7_days";
  }
}

export function getUserActivityPeriodRange(
  period: UserActivityPeriod,
  options?: { from?: string | null; to?: string | null; now?: Date },
): { startIso: string; endIso: string; label: string } {
  const now = options?.now ?? new Date();
  const today = jstYmd(now);
  const tomorrow = addDays(today.year, today.month, today.day, 1);

  if (period === "today") {
    return {
      startIso: jstDayStartIso(today.year, today.month, today.day),
      endIso: jstDayStartIso(tomorrow.year, tomorrow.month, tomorrow.day),
      label: "今日",
    };
  }

  if (period === "last_7_days") {
    const from = addDays(today.year, today.month, today.day, -6);
    return {
      startIso: jstDayStartIso(from.year, from.month, from.day),
      endIso: jstDayStartIso(tomorrow.year, tomorrow.month, tomorrow.day),
      label: "過去7日",
    };
  }

  if (period === "last_30_days") {
    const from = addDays(today.year, today.month, today.day, -29);
    return {
      startIso: jstDayStartIso(from.year, from.month, from.day),
      endIso: jstDayStartIso(tomorrow.year, tomorrow.month, tomorrow.day),
      label: "過去30日",
    };
  }

  if (period === "this_month") {
    const bounds = getJstMonthBounds(0, now);
    return {
      startIso: bounds.startIso,
      endIso: bounds.endIso,
      label: "今月",
    };
  }

  if (period === "last_month") {
    const bounds = getJstMonthBounds(-1, now);
    return {
      startIso: bounds.startIso,
      endIso: bounds.endIso,
      label: "先月",
    };
  }

  const fromRaw = options?.from?.trim() ?? "";
  const toRaw = options?.to?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromRaw) || !/^\d{4}-\d{2}-\d{2}$/.test(toRaw)) {
    const fallback = getUserActivityPeriodRange("last_7_days", { now });
    return { ...fallback, label: "期間指定（日付を選択してください）" };
  }

  let start = fromRaw;
  let end = toRaw;
  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const endNext = addDays(ey, em, ed, 1);

  return {
    startIso: jstDayStartIso(sy, sm, sd),
    endIso: jstDayStartIso(endNext.year, endNext.month, endNext.day),
    label: `${start} 〜 ${end}`,
  };
}

export function deviceTypeFromUserAgent(
  userAgent: string | null | undefined,
): string | null {
  if (!userAgent?.trim()) return null;
  const ua = userAgent;
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return "タブレット";
  if (/Mobile|iPhone|Android.+Mobile|webOS|BlackBerry|Opera Mini/i.test(ua)) {
    return "スマホ";
  }
  return "PC";
}

export function featureLabelFromEventType(eventType: string): string {
  switch (eventType) {
    case "job_impression":
      return "求人一覧表示";
    case "job_detail_click":
    case "job_view":
      return "求人詳細閲覧";
    case "line_click":
    case "line":
      return "LINE応募クリック";
    case "phone_click":
    case "phone":
      return "電話応募クリック";
    case "diagnosis":
      return "職種診断";
    case "black_report":
      return "ブラック店報告";
    default:
      return eventType;
  }
}

export function unavailableMetric(note = "現在取得していません"): MetricAvailability {
  return { available: false, value: null, note };
}

export function availableMetric(
  value: number,
  note?: string,
): MetricAvailability {
  return { available: true, value, note };
}
