/** JST calendar month bounds as ISO strings (inclusive start, exclusive end). */
export function getJstMonthBounds(offsetMonths = 0, referenceDate = new Date()): {
  startIso: string;
  endIso: string;
  monthKey: string;
  label: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(referenceDate);

  let year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  let month = Number(parts.find((part) => part.type === "month")?.value ?? "0");

  month += offsetMonths;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  const startIso = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`,
  ).toISOString();

  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const endIso = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`,
  ).toISOString();

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return {
    startIso,
    endIso,
    monthKey,
    label: `${year}年${month}月`,
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
