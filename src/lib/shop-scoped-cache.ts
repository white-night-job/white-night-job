type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  jobId: string;
};

const store = new Map<string, CacheEntry<unknown>>();

export function getShopScopedCache<T>(
  key: string,
  jobId: string,
): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.jobId !== jobId) {
    store.delete(key);
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setShopScopedCache<T>(
  key: string,
  jobId: string,
  value: T,
  ttlMs: number,
): void {
  store.set(key, {
    value,
    jobId,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateShopScopedCache(jobId: string): void {
  for (const [key, entry] of store.entries()) {
    if (entry.jobId === jobId) store.delete(key);
  }
}

export function shopSessionCacheKey(jobId: string): string {
  return `shop-session:${jobId}`;
}

export function shopDashboardCoreCacheKey(jobId: string): string {
  return `shop-dashboard-core:${jobId}`;
}
