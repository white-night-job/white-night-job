import { getPlanFeatures, parseJobPlan, type JobPlan } from "@/lib/job-plan";

type PublishDateSource = {
  postedAt?: string | null;
};

type NewListingSource = PublishDateSource & {
  plan?: JobPlan | string | null;
  newListingEnabled?: boolean | null;
};

/** Parse DB date / ISO string as a local calendar date (公開日). */
export function getPublishDate(job: PublishDateSource): Date {
  const raw = String(job.postedAt ?? "").trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return new Date(NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function getNewListingDays(plan: JobPlan | string | null | undefined): number {
  return getPlanFeatures(parseJobPlan(plan)).newListingDays;
}

/**
 * 新着掲載の最終日（公開日 + プラン日数）。
 * この日までは新着一覧に表示する（当日含む）。
 */
export function getNewListingEndDate(job: NewListingSource): Date {
  const start = getPublishDate(job);
  if (Number.isNaN(start.getTime())) return new Date(NaN);
  const end = new Date(start);
  end.setDate(end.getDate() + getNewListingDays(job.plan));
  return end;
}

export function formatNewListingEndDate(job: NewListingSource): string {
  const end = getNewListingEndDate(job);
  if (Number.isNaN(end.getTime())) return "—";
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const d = String(end.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 公開日を基準に、プランごとの新着期間内かどうか。
 * 期間外でも通常の求人一覧には残る（この関数は新着一覧判定専用）。
 */
export function isNewListingJob(
  job: NewListingSource,
  now = new Date(),
): boolean {
  if (job.newListingEnabled === false) return false;
  const end = getNewListingEndDate(job);
  if (Number.isNaN(end.getTime())) return false;
  return startOfLocalDay(now).getTime() <= end.getTime();
}

/** @deprecated Prefer getPublishDate — kept for callers that used max(posted, created). */
export function getJobListingDate(job: {
  postedAt: string;
  createdAt?: string;
}): Date {
  return getPublishDate(job);
}

export function toPostedAtDateInputValue(postedAt?: string | null): string {
  const raw = String(postedAt ?? "").trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parsePostedAtFromBody(
  body: Record<string, unknown>,
): string | null {
  const raw = body.posted_at ?? body.postedAt;
  if (raw == null || raw === "") return null;
  const value = String(raw).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** Parse open_date / openDate as YYYY-MM-DD, or null if empty/invalid. */
export function parseOpenDateFromBody(
  body: Record<string, unknown>,
): string | null | undefined {
  if (!("open_date" in body) && !("openDate" in body)) return undefined;
  const raw = body.open_date ?? body.openDate;
  if (raw == null || raw === "") return null;
  const value = String(raw).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function toOpenDateInputValue(openDate?: string | null): string {
  const raw = String(openDate ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

type OpenDateSource = {
  openDate?: string | null;
};

function parseLocalDate(raw: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim().slice(0, 10));
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * 新規オープン掲載の最終日（オープン日 + 6か月）。
 * この日までは新規オープン一覧に表示する（当日含む）。
 */
export function getNewlyOpenedEndDate(job: OpenDateSource): Date {
  const start = parseLocalDate(String(job.openDate ?? ""));
  if (Number.isNaN(start.getTime())) return new Date(NaN);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  return end;
}

/**
 * オープン日を基準に、オープンから6か月以内かどうか。
 * オープン日未設定・未来日は対象外。期間外でも通常の求人一覧には残る。
 */
export function isNewlyOpenedShopJob(
  job: OpenDateSource,
  now = new Date(),
): boolean {
  const openRaw = String(job.openDate ?? "").trim();
  if (!openRaw) return false;
  const start = parseLocalDate(openRaw);
  const end = getNewlyOpenedEndDate(job);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const today = startOfLocalDay(now).getTime();
  return (
    today >= startOfLocalDay(start).getTime() &&
    today <= startOfLocalDay(end).getTime()
  );
}
