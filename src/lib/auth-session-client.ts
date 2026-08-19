import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";

export { SESSION_EXPIRED_MESSAGE };

export class SessionExpiredError extends Error {
  readonly isSessionExpired = true;

  constructor(message: string = SESSION_EXPIRED_MESSAGE) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): boolean {
  return (
    error instanceof SessionExpiredError ||
    (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE)
  );
}

export async function checkAdminSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/session", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function checkShopSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/shop-session", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function readJsonWithAuth<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & {
    message?: string;
    field?: string;
  };
  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError(data.message ?? SESSION_EXPIRED_MESSAGE);
    }
    const err = new Error(data.message ?? "通信に失敗しました。") as Error & {
      field?: string;
    };
    if (data.field) err.field = data.field;
    throw err;
  }
  return data;
}

function appendRestoreDraftParam(path: string): string {
  if (path.includes("restoreDraft=1")) return path;
  return `${path}${path.includes("?") ? "&" : "?"}restoreDraft=1`;
}

export function buildShopLoginRedirectUrl(returnPath = "/shop-dashboard"): string {
  const next = appendRestoreDraftParam(returnPath);
  return `/shop-login?next=${encodeURIComponent(next)}&expired=1`;
}

export function buildAdminLoginRedirectUrl(returnPath = "/admin/jobs"): string {
  const next = appendRestoreDraftParam(returnPath);
  return `/admin/login?next=${encodeURIComponent(next)}&expired=1`;
}
