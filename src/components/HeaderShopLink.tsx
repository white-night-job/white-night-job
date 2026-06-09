"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function HeaderShopLink() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setReady(true));
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const href = authenticated ? "/shop-dashboard" : "/shop-login";
  const label = authenticated ? "店舗管理" : "店舗ログイン";

  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
        authenticated
          ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-gold hover:brightness-105"
          : "border-gold/40 bg-white text-gold-dark hover:border-gold hover:bg-ivory"
      } ${ready ? "" : "opacity-80"}`}
    >
      {label}
    </Link>
  );
}
