"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LineLoginRequiredModal } from "@/components/LineLoginRequiredModal";
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
  const { session, ready } = useUserSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const redirectPath = useMemo(() => pathname || "/", [pathname]);

  async function fetchFavoriteState() {
    if (!session.authenticated || !session.user?.id) return;
    if (
      favoriteCacheReady &&
      favoriteCacheUserId === session.user.id
    ) {
      setIsFavorite(favoriteCache.has(jobId));
      return;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/favorites", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        favorites?: Array<{ job_id: string }>;
      };
      favoriteCache = new Set((data.favorites ?? []).map((item) => item.job_id));
      favoriteCacheUserId = session.user.id;
      favoriteCacheReady = true;
      const exists = favoriteCache.has(jobId);
      setIsFavorite(exists);
    } finally {
      setChecking(false);
    }
  }

  async function handleToggle() {
    if (!session.authenticated) {
      setShowLoginModal(true);
      return;
    }

    setChecking(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?jobId=${encodeURIComponent(jobId)}`, {
          method: "DELETE",
          credentials: "include",
        });
        favoriteCache.delete(jobId);
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobId }),
        });
        favoriteCache.add(jobId);
        setIsFavorite(true);
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!session.authenticated) {
      favoriteCache.clear();
      favoriteCacheUserId = null;
      favoriteCacheReady = false;
      setIsFavorite(false);
      return;
    }
    if (!ready || !session.authenticated) return;
    void fetchFavoriteState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session.authenticated, session.user?.id, jobId]);

  return (
    <>
      <button
        type="button"
        aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
        onClick={handleToggle}
        disabled={checking}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/35 bg-white/92 text-lg shadow-gold transition ${className}`}
      >
        <span className={isFavorite ? "text-gold-dark" : "text-muted"}>♥</span>
      </button>
      <LineLoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectPath={redirectPath}
      />
    </>
  );
}
