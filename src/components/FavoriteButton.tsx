"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";

type FavoriteButtonProps = {
  jobId: string;
  className?: string;
};

let favoriteCacheUserId: string | null = null;
let favoriteCache = new Set<string>();
let favoriteCacheReady = false;

export function FavoriteButton({ jobId, className = "" }: FavoriteButtonProps) {
  const pathname = usePathname();
  const { currentUser, isLoggedIn, ready, refreshSession } = useUserSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = useMemo(() => pathname || "/", [pathname]);
  const lineLoginHref = `/api/line/login?redirect=${encodeURIComponent(redirectPath)}`;
  const userId = currentUser?.id ?? null;

  async function fetchFavoriteState(activeUserId: string) {
    if (favoriteCacheReady && favoriteCacheUserId === activeUserId) {
      setIsFavorite(favoriteCache.has(jobId));
      return;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/favorites", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error("[FavoriteButton] favorites fetch failed:", {
          status: response.status,
          body,
          userId: activeUserId,
        });
        return;
      }
      const data = (await response.json()) as {
        favorites?: Array<{ job_id: string }>;
      };
      favoriteCache = new Set((data.favorites ?? []).map((item) => item.job_id));
      favoriteCacheUserId = activeUserId;
      favoriteCacheReady = true;
      setIsFavorite(favoriteCache.has(jobId));
    } finally {
      setChecking(false);
    }
  }

  async function toggleFavorite(): Promise<"ok" | "unauthorized" | "error"> {
    if (isFavorite) {
      const response = await fetch(
        `/api/favorites?jobId=${encodeURIComponent(jobId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (response.status === 401) return "unauthorized";
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error("[FavoriteButton] favorite delete failed:", {
          status: response.status,
          body,
          userId,
          jobId,
        });
        return "error";
      }
      favoriteCache.delete(jobId);
      setIsFavorite(false);
      return "ok";
    }

    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jobId }),
    });
    if (response.status === 401) return "unauthorized";
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error("[FavoriteButton] favorite insert failed:", {
        status: response.status,
        body,
        userId,
        jobId,
      });
      return "error";
    }
    favoriteCache.add(jobId);
    setIsFavorite(true);
    return "ok";
  }

  async function handleToggle() {
    if (!ready || checking) return;

    setErrorMessage(null);
    setChecking(true);

    console.log("[FavoriteButton] click", {
      currentUser,
      userId,
      isLoggedIn,
      jobId,
      ready,
    });

    try {
      let result = await toggleFavorite();

      if (result === "unauthorized") {
        const nextSession = await refreshSession();
        const refreshedUserId = nextSession.user?.id ?? null;
        const refreshedLoggedIn = Boolean(refreshedUserId);

        console.log("[FavoriteButton] unauthorized, refreshed session", {
          currentUser: nextSession.user ?? null,
          userId: refreshedUserId,
          isLoggedIn: refreshedLoggedIn,
          reason: nextSession.reason ?? null,
        });

        if (!refreshedLoggedIn) {
          console.log("[FavoriteButton] redirecting to LINE login because currentUser is null", {
            reason: nextSession.reason ?? "unauthorized",
            jobId,
          });
          window.location.href = lineLoginHref;
          return;
        }

        result = await toggleFavorite();
      }

      if (result === "unauthorized") {
        console.log("[FavoriteButton] redirecting to LINE login after retry still unauthorized", {
          userId,
          jobId,
        });
        window.location.href = lineLoginHref;
        return;
      }

      if (result === "error") {
        setErrorMessage("お気に入り登録に失敗しました");
        return;
      }

      if (result === "ok" && !isLoggedIn) {
        await refreshSession();
      }
    } catch (error) {
      console.error("[FavoriteButton] favorite toggle failed:", error);
      setErrorMessage("お気に入り登録に失敗しました");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!userId) {
      favoriteCache.clear();
      favoriteCacheUserId = null;
      favoriteCacheReady = false;
      setIsFavorite(false);
      return;
    }
    if (!ready) return;
    void fetchFavoriteState(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, jobId]);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
        onClick={handleToggle}
        disabled={checking || !ready}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-white/92 text-lg shadow-gold transition disabled:opacity-60 ${className}`}
      >
        <span className={isFavorite ? "text-gold-dark" : "text-muted"}>♥</span>
      </button>
      {isLoggedIn && ready && (
        <span className="hidden text-[10px] font-medium text-gold-dark sm:inline">
          LINEログイン済み
        </span>
      )}
      {errorMessage && (
        <p className="max-w-[8rem] text-center text-[10px] leading-tight text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
