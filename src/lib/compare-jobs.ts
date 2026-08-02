const STORAGE_KEY = "white-night-compare-jobs";
const MAX_COMPARE = 3;
export const COMPARE_CHANGED_EVENT = "wnj-compare-changed";

export const COMPARE_MAX = MAX_COMPARE;

function notifyCompareChanged(jobIds: string[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(COMPARE_CHANGED_EVENT, { detail: { jobIds } }),
  );
}

export function loadCompareJobIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string" && id.trim()).slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

export function saveCompareJobIds(jobIds: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(jobIds.slice(0, MAX_COMPARE)),
  );
  notifyCompareChanged(jobIds.slice(0, MAX_COMPARE));
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

export function toggleCompareJobId(jobId: string): {
  ok: boolean;
  action?: "added" | "removed";
  reason?: "full";
  jobIds: string[];
} {
  const current = loadCompareJobIds();
  if (current.includes(jobId)) {
    const next = current.filter((id) => id !== jobId);
    saveCompareJobIds(next);
    return { ok: true, action: "removed", jobIds: next };
  }
  if (current.length >= MAX_COMPARE) {
    return { ok: false, reason: "full", jobIds: current };
  }
  const next = [...current, jobId];
  saveCompareJobIds(next);
  return { ok: true, action: "added", jobIds: next };
}

/** 診断おすすめなど、最大3件で比較リストを差し替える */
export function replaceCompareJobIds(jobIds: string[]): string[] {
  const next = [...new Set(jobIds.filter(Boolean))].slice(0, MAX_COMPARE);
  saveCompareJobIds(next);
  return next;
}
