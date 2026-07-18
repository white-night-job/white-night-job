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

export function buildWebLineLoginHref(
  redirectPath: string,
  options?: { disableAutoLogin?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("redirect", sanitizePath(redirectPath));
  // Safari / external browser: keep auth in the browser so bot_prompt friend-add
  // is not skipped by iOS Universal Links Auto Login into the LINE app.
  if (options?.disableAutoLogin) {
    params.set("disable_auto_login", "1");
  }
  return `/api/line/login?${params.toString()}`;
}

/** Guarantee bot_prompt=aggressive on an authorize URL (never strip / overwrite to empty). */
export function ensureBotPromptAggressive(authorizeUrl: string): string {
  const url = new URL(authorizeUrl);
  url.searchParams.set("bot_prompt", "aggressive");
  return url.toString();
}

/**
 * Safari / Chrome: resolve the final OAuth authorize URL (with bot_prompt),
 * log it, then navigate. Never uses LIFF.
 */
export async function navigateToWebLineOAuth(redirectPath: string): Promise<void> {
  const href = buildWebLineLoginHref(redirectPath, { disableAutoLogin: true });
  const jsonHref = href.includes("?")
    ? `${href}&format=json`
    : `${href}?format=json`;

  try {
    const response = await fetch(jsonHref, {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[line-oauth] /api/line/login json failed", response.status);
      window.location.assign(href);
      return;
    }
    const data = (await response.json()) as {
      authorizeUrl?: string;
      fallbackUrl?: string;
    };
    const raw = data.authorizeUrl || data.fallbackUrl;
    if (!raw) {
      console.error("[line-oauth] authorizeUrl missing in response", data);
      window.location.assign(href);
      return;
    }

    const authorizeUrl = ensureBotPromptAggressive(raw);
    const query = new URL(authorizeUrl).searchParams.toString();
    console.info("[line-oauth] final authorize URL query", query);
    console.info("[line-oauth] bot_prompt", new URL(authorizeUrl).searchParams.get("bot_prompt"));
    logLiffDebug("web_oauth_navigate", {
      choseLiffUrl: false,
      botPrompt: new URL(authorizeUrl).searchParams.get("bot_prompt"),
      disableAutoLogin: new URL(authorizeUrl).searchParams.get("disable_auto_login"),
      navigationTarget: "access.line.me",
    });

    window.location.assign(authorizeUrl);
  } catch (error) {
    console.error("[line-oauth] navigate failed, falling back to /api/line/login", error);
    window.location.assign(href);
  }
}

/** Temporary production debug (no secrets). */
export function logLiffDebug(
  event: string,
  detail: Record<string, string | boolean | null | undefined>,
) {
  console.info("[liff-debug]", event, detail);
}
