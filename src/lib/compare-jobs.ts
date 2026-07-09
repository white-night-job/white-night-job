const STORAGE_KEY = "white-night-compare-jobs";
const MAX_COMPARE = 3;

export function loadCompareJobIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function saveCompareJobIds(jobIds: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobIds.slice(0, MAX_COMPARE)));
}

export function addCompareJobId(jobId: string): {
  ok: boolean;
  reason?: "full" | "duplicate";
  jobIds: string[];
} {
  const current = loadCompareJobIds();
  if (current.includes(jobId)) {
    return { ok: false, reason: "duplicate", jobIds: current };
  }
  if (current.length >= MAX_COMPARE) {
    return { ok: false, reason: "full", jobIds: current };
  }
  const next = [...current, jobId];
  saveCompareJobIds(next);
  return { ok: true, jobIds: next };
}

export function removeCompareJobId(jobId: string): string[] {
  const next = loadCompareJobIds().filter((id) => id !== jobId);
  saveCompareJobIds(next);
  return next;
}

export const COMPARE_MAX = MAX_COMPARE;
