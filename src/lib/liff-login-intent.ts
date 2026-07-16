export const LIFF_INTENT_STORAGE_KEY = "white-night-liff-intent";

export type LiffLoginIntent = {
  redirectPath: string;
  action?: "favorite" | "consultation" | "diagnosis" | "general";
  favoriteJobId?: string;
  createdAt: number;
};

function sanitizePath(path: string): string {
  const value = path.trim() || "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export function saveLiffLoginIntent(input: {
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
}): LiffLoginIntent {
  const intent: LiffLoginIntent = {
    redirectPath: sanitizePath(
      input.redirectPath ||
        (typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : "/"),
    ),
    action: input.action,
    favoriteJobId: input.favoriteJobId,
    createdAt: Date.now(),
  };

  try {
    sessionStorage.setItem(LIFF_INTENT_STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // ignore quota / private mode
  }
  return intent;
}

export function readLiffLoginIntent(): LiffLoginIntent | null {
  try {
    const raw = sessionStorage.getItem(LIFF_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiffLoginIntent;
    if (!parsed?.redirectPath) return null;
    return {
      ...parsed,
      redirectPath: sanitizePath(parsed.redirectPath),
    };
  } catch {
    return null;
  }
}

export function clearLiffLoginIntent() {
  try {
    sessionStorage.removeItem(LIFF_INTENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function resolvePostLoginPath(intent: LiffLoginIntent | null): string {
  if (!intent) return "/";
  let path = sanitizePath(intent.redirectPath);

  if (intent.action === "favorite" && intent.favoriteJobId) {
    const url = new URL(path, "https://www.whitenightjob.jp");
    url.searchParams.set("autoFavorite", "1");
    path = `${url.pathname}${url.search}${url.hash}`;
  }

  return path;
}

export function getLiffRedirectUri(): string {
  if (typeof window === "undefined") {
    return "https://www.whitenightjob.jp/auth/line/liff";
  }
  return `${window.location.origin}/auth/line/liff`;
}

export function getPublicLiffId(): string | null {
  const value = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  return value || null;
}

export function buildWebLineLoginHref(redirectPath: string): string {
  return `/api/line/login?redirect=${encodeURIComponent(sanitizePath(redirectPath))}`;
}
