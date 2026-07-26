"use client";

/**
 * Short-lived in-memory cache for logged-in user data (mypage sections).
 * Entries are bound to a user id so a different account can never read them,
 * and everything is dropped on logout / user switch.
 */
type CacheEntry = {
  userId: string;
  savedAt: number;
  value: unknown;
};

const DEFAULT_TTL_MS = 60_000;
const store = new Map<string, CacheEntry>();

export function readUserCache<T>(
  key: string,
  userId: string | null | undefined,
  ttlMs: number = DEFAULT_TTL_MS,
): T | null {
  if (!userId) return null;
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.userId !== userId) {
    store.delete(key);
    return null;
  }
  if (Date.now() - entry.savedAt > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function writeUserCache(
  key: string,
  userId: string | null | undefined,
  value: unknown,
): void {
  if (!userId) return;
  store.set(key, { userId, savedAt: Date.now(), value });
}

export function clearUserCache(): void {
  store.clear();
}
