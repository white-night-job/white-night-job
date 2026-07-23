"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function resolveLogoHref(pathname: string | null): {
  href: string;
  ariaLabel: string;
} {
  if (pathname?.startsWith("/admin")) {
    return {
      href: "/admin",
      ariaLabel: "管理画面トップへ戻る",
    };
  }

  return {
    href: "/",
    ariaLabel: "トップページへ戻る",
  };
}

export function HeaderLogo() {
  const pathname = usePathname();
  const { href, ariaLabel } = resolveLogoHref(pathname);

  return (
    <Link href={href} aria-label={ariaLabel} className="header-logo-link">
      <span className="header-logo-wordmark font-serif">
        <span className="header-logo-brand">White Night</span>
        <span className="header-logo-job"> Job</span>
      </span>
    </Link>
  );
}
