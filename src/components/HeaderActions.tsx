"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderMenu } from "@/components/HeaderMenu";

export function HeaderActions() {
  const pathname = usePathname();
  const [shopAuthenticated, setShopAuthenticated] = useState(false);
  const [shopReady, setShopReady] = useState(false);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setShopAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setShopAuthenticated(false))
      .finally(() => setShopReady(true));
  }, [pathname]);

  const hideShopLink = pathname.startsWith("/admin");
  const shopHref = shopAuthenticated ? "/shop-dashboard" : "/shop-login";
  const shopLabel = shopAuthenticated ? "店舗管理" : "店舗様ログイン";

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      {!hideShopLink && (
        <Link
          href={shopHref}
          className={`header-shop-btn ${shopReady ? "" : "opacity-80"}`}
        >
          {shopLabel}
        </Link>
      )}
      <HeaderMenu />
    </div>
  );
}
