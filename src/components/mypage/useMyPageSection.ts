"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { readUserCache, writeUserCache } from "@/lib/user-data-cache";

export type SectionStatus = "loading" | "ready" | "error" | "signed-out";

type Options<T> = {
  /** Cache key, scoped to the logged-in user id. */
  cacheKey: string;
  url: string;
  parse: (raw: unknown) => T;
  fallback: T;
};

/**
 * Loads one mypage section independently so a slow or failing endpoint can
 * never block the rest of the page.
 */
export function useMyPageSection<T>({ cacheKey, url, parse, fallback }: Options<T>) {
  const { currentUser, isLoggedIn, ready } = useUserSession();
  const userId = currentUser?.id ?? null;
  const parseRef = useRef(parse);
  parseRef.current = parse;

  const cached = readUserCache<T>(cacheKey, userId);
  const [data, setData] = useState<T>(cached ?? fallback);
  const [status, setStatus] = useState<SectionStatus>(cached ? "ready" : "loading");

  const load = useCallback(
    async (targetUrl: string, { silent }: { silent?: boolean } = {}) => {
      if (!userId) return;
      if (!silent) setStatus((current) => (current === "ready" ? current : "loading"));
      try {
        const response = await fetch(targetUrl, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          console.error("[mypage] section fetch failed", {
            url: targetUrl,
            status: response.status,
          });
          setStatus((current) => (current === "ready" ? current : "error"));
          return;
        }
        const raw = (await response.json()) as unknown;
        const parsed = parseRef.current(raw);
        writeUserCache(cacheKey, userId, parsed);
        setData(parsed);
        setStatus("ready");
      } catch (error) {
        console.error("[mypage] section fetch threw", { url: targetUrl, error });
        setStatus((current) => (current === "ready" ? current : "error"));
      }
    },
    [cacheKey, userId],
  );

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn || !userId) {
      setStatus("signed-out");
      return;
    }

    const fromCache = readUserCache<T>(cacheKey, userId);
    if (fromCache) {
      setData(fromCache);
      setStatus("ready");
      return;
    }

    void load(url);
  }, [cacheKey, isLoggedIn, load, ready, url, userId]);

  return { data, setData, status, reload: load };
}
