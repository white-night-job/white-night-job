export const LIFF_INTENT_STORAGE_KEY = "white-night-liff-intent";
export const LIFF_LOGIN_ATTEMPT_KEY = "white-night-liff-login-attempt";

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

/** Normalize NEXT_PUBLIC_LIFF_ID (trim, strip CR/LF, reject empty). */
export function normalizeLiffId(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const value = String(raw).replace(/\r?\n/g, "").trim();
  return value || null;
}

export function getPublicLiffId(): string | null {
  return normalizeLiffId(process.env.NEXT_PUBLIC_LIFF_ID);
}

export function buildLiffAppUrl(
  liffId: string,
  intent?: Partial<LiffLoginIntent> | null,
): string {
  const url = new URL(`https://liff.line.me/${liffId}`);
  if (intent?.redirectPath) {
    url.searchParams.set("redirect", sanitizePath(intent.redirectPath));
  }
  if (intent?.action) {
    url.searchParams.set("action", intent.action);
  }
  if (intent?.favoriteJobId) {
    url.searchParams.set("jobId", intent.favoriteJobId);
  }
  return url.toString();
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

  // Cookie backup: LIFF opens Endpoint in LINE WebView where sessionStorage
  // from the previous browser may be unavailable.
  try {
    const maxAge = 60 * 15;
    const encoded = encodeURIComponent(JSON.stringify(intent));
    document.cookie = `white-night-liff-intent=${encoded}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {
    // ignore
  }

  return intent;
}

export function readLiffLoginIntentFromSearchParams(
  searchParams: URLSearchParams,
): Partial<LiffLoginIntent> | null {
  const redirect = searchParams.get("redirect");
  const action = searchParams.get("action") as LiffLoginIntent["action"] | null;
  const favoriteJobId = searchParams.get("jobId") || undefined;
  if (!redirect && !action && !favoriteJobId) return null;
  return {
    redirectPath: redirect ? sanitizePath(redirect) : undefined,
    action: action || undefined,
    favoriteJobId,
  };
}

export function readLiffLoginIntent(): LiffLoginIntent | null {
  try {
    const raw = sessionStorage.getItem(LIFF_INTENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiffLoginIntent;
      if (parsed?.redirectPath) {
        return {
          ...parsed,
          redirectPath: sanitizePath(parsed.redirectPath),
        };
      }
    }
  } catch {
    // ignore
  }

  try {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("white-night-liff-intent="));
    if (match) {
      const value = decodeURIComponent(match.slice("white-night-liff-intent=".length));
      const parsed = JSON.parse(value) as LiffLoginIntent;
      if (parsed?.redirectPath) {
        return {
          ...parsed,
          redirectPath: sanitizePath(parsed.redirectPath),
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function clearLiffLoginIntent() {
  try {
    sessionStorage.removeItem(LIFF_INTENT_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    document.cookie =
      "white-night-liff-intent=; path=/; max-age=0; samesite=lax";
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

export function buildWebLineLoginHref(redirectPath: string): string {
  return `/api/line/login?redirect=${encodeURIComponent(sanitizePath(redirectPath))}`;
}

/** Temporary production debug (no secrets). */
export function logLiffDebug(
  event: string,
  detail: Record<string, string | boolean | null | undefined>,
) {
  console.info("[liff-debug]", event, detail);
}
