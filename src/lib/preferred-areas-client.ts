"use client";

import { useEffect, useReducer } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { normalizePreferredAreas } from "@/lib/preferred-areas";
import type { District } from "@/types/job";

type Store = {
  userId: string | null;
  areas: District[];
  loaded: boolean;
};

const NO_AREAS: District[] = [];

let store: Store = { userId: null, areas: NO_AREAS, loaded: false };
let inflight: { userId: string; promise: Promise<void> } | null = null;
const listeners = new Set<() => void>();

function setStore(next: Store) {
  store = next;
  listeners.forEach((listener) => listener());
}

function ensureLoaded(userId: string): Promise<void> {
  if (store.userId === userId && store.loaded) return Promise.resolve();
  if (inflight?.userId === userId) return inflight.promise;

  const promise = fetch("/api/preferred-areas", {
    cache: "no-store",
    credentials: "include",
  })
    .then(async (response) => {
      const data = response.ok
        ? ((await response.json()) as { areas?: unknown })
        : { areas: [] };
      setStore({ userId, areas: normalizePreferredAreas(data.areas), loaded: true });
    })
    .catch(() => {
      // 取得失敗時は未設定扱い（全エリア表示）
      setStore({ userId, areas: [], loaded: true });
    })
    .finally(() => {
      if (inflight?.userId === userId) inflight = null;
    });

  inflight = { userId, promise };
  return promise;
}

export async function savePreferredAreas(
  userId: string,
  areas: District[],
): Promise<District[]> {
  const response = await fetch("/api/preferred-areas", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ areas }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    areas?: unknown;
  };
  if (!response.ok) {
    throw new Error(data.message ?? "保存に失敗しました。");
  }
  const saved = normalizePreferredAreas(data.areas);
  setStore({ userId, areas: saved, loaded: true });
  return saved;
}

/**
 * ログインユーザーの希望エリア。未ログイン・未設定時は空配列（全エリア対象）。
 * 保存すると利用中の全コンポーネントへ即時反映される。
 */
export function usePreferredAreas() {
  const { currentUser, ready: sessionReady } = useUserSession();
  const userId = currentUser?.id ?? null;
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  useEffect(() => {
    if (!sessionReady || !userId) return;
    void ensureLoaded(userId);
  }, [sessionReady, userId]);

  const loadedForUser = userId !== null && store.userId === userId && store.loaded;
  const areas = loadedForUser ? store.areas : NO_AREAS;

  return {
    userId,
    areas,
    configured: areas.length > 0,
    ready: sessionReady && (!userId || loadedForUser),
  };
}
