"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FavoriteLoginBottomSheet } from "@/components/FavoriteLoginBottomSheet";
import { useUserSession } from "@/components/UserSessionProvider";

type FavoriteButtonProps = {
  jobId: string;
  className?: string;
  /** 店舗詳細ページのみ true。未ログイン時にLINEログイン案内を表示する */
  allowLineLoginRedirect?: boolean;
};

let favoriteCacheUserId: string | null = null;
let favoriteCache = new Set<string>();
let favoriteCacheReady = false;

function clearAutoFavoriteQueryParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("autoFavorite")) return;
  url.searchParams.delete("autoFavorite");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function FavoriteButton({
  jobId,
  className = "",
  allowLineLoginRedirect = false,
}: FavoriteButtonProps) {
  const pathname = usePathname();
  const { currentUser, isLoggedIn, ready, refreshSession } = useUserSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [autoFavoriteHandled, setAutoFavoriteHandled] = useState(false);

  const redirectPath = useMemo(() => pathname || "/", [pathname]);
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

  async function addFavorite(): Promise<"ok" | "unauthorized" | "error"> {
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

  async function removeFavorite(): Promise<"ok" | "unauthorized" | "error"> {
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

  async function toggleFavorite(): Promise<"ok" | "unauthorized" | "error"> {
    if (isFavorite) {
      return removeFavorite();
    }
    return addFavorite();
  }

  async function handleToggle() {
    if (!ready || checking) return;

    if (!isLoggedIn && allowLineLoginRedirect) {
      setSheetOpen(true);
      return;
    }

    if (!isLoggedIn) {
      return;
    }

    setErrorMessage(null);
    setChecking(true);

    try {
      let result = await toggleFavorite();

      if (result === "unauthorized") {
        const nextSession = await refreshSession();
        const refreshedLoggedIn = Boolean(nextSession.user?.id);

        if (!refreshedLoggedIn) {
          if (allowLineLoginRedirect) {
            setSheetOpen(true);
          }
          return;
        }

        result = await toggleFavorite();
      }

      if (result === "unauthorized") {
        if (allowLineLoginRedirect) {
          setSheetOpen(true);
        }
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

  useEffect(() => {
    if (!ready || !isLoggedIn || !allowLineLoginRedirect || autoFavoriteHandled) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("autoFavorite") !== "1") return;

    let cancelled = false;

    async function applyAutoFavorite() {
      setChecking(true);
      setErrorMessage(null);

      try {
        if (!favoriteCacheReady || favoriteCacheUserId !== userId) {
          await fetchFavoriteState(userId!);
        }

        if (cancelled) return;

        if (!favoriteCache.has(jobId)) {
          const result = await addFavorite();
          if (result === "error") {
            setErrorMessage("お気に入り登録に失敗しました");
          }
        } else {
          setIsFavorite(true);
        }
      } catch (error) {
        console.error("[FavoriteButton] auto favorite failed:", error);
        if (!cancelled) {
          setErrorMessage("お気に入り登録に失敗しました");
        }
      } finally {
        if (!cancelled) {
          clearAutoFavoriteQueryParam();
          setAutoFavoriteHandled(true);
          setChecking(false);
        }
      }
    }

    void applyAutoFavorite();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isLoggedIn, allowLineLoginRedirect, autoFavoriteHandled, jobId, userId]);

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
          onClick={handleToggle}
          disabled={checking || !ready || (!isLoggedIn && !allowLineLoginRedirect)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-white/92 text-lg shadow-gold transition disabled:opacity-60 ${className}`}
        >
          <span className={isFavorite ? "text-gold-dark" : "text-muted"}>♥</span>
        </button>
        {errorMessage && (
          <p className="max-w-[8rem] text-center text-[10px] leading-tight text-red-600">
            {errorMessage}
          </p>
        )}
      </div>

      {allowLineLoginRedirect && (
        <FavoriteLoginBottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          redirectPath={redirectPath}
          favoriteJobId={jobId}
        />
      )}
    </>
  );
}
