"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード", match: "exact" as const },
  {
    href: "/admin/listing-reviews",
    label: "掲載審査管理",
    match: "prefix" as const,
  },
  { href: "/admin/jobs", label: "求人管理", match: "prefix" as const },
  {
    href: "/admin/line-broadcast",
    label: "LINE配信管理",
    match: "prefix" as const,
  },
  {
    href: "/admin/line-history",
    label: "LINE通知履歴",
    match: "prefix" as const,
  },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  initialAuthenticated,
}: {
  children: ReactNode;
  initialAuthenticated: boolean;
}) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [checking, setChecking] = useState(!initialAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { credentials: "include" });
      const data = (await res.json()) as { authenticated?: boolean };
      const ok = Boolean(data.authenticated);
      setAuthenticated(ok);
      return ok;
    } catch {
      setAuthenticated(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession, pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (checking) return;
    if (!authenticated && !isLoginPage) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
    if (authenticated && isLoginPage) {
      router.replace("/admin");
    }
  }, [authenticated, checking, isLoginPage, pathname, router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    setAuthenticated(false);
    router.replace("/admin/login");
  }

  if (isLoginPage) {
    return <div className="admin-app">{children}</div>;
  }

  if (checking || !authenticated) {
    return (
      <div className="admin-app admin-app--loading">
        <p className="admin-muted">管理画面を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="admin-menu-toggle-bars" aria-hidden />
          メニュー
        </button>
        <div className="admin-topbar-brand">
          <span className="admin-topbar-kicker">Admin</span>
          <span className="admin-topbar-title">White Night Job 管理画面</span>
        </div>
        <Link href="/" className="admin-topbar-site" target="_blank" rel="noopener noreferrer">
          サイトを見る
        </Link>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="メニューを閉じる"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="admin-body">
        <aside
          id="admin-sidebar"
          className={`admin-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="管理メニュー"
        >
          <p className="admin-nav-section">管理項目</p>
          <nav className="admin-nav-list">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="admin-nav-footer">
            <Link href="/" className="admin-nav-link admin-nav-link--muted" target="_blank" rel="noopener noreferrer">
              サイトを見る
            </Link>
            <button
              type="button"
              className="admin-nav-link admin-nav-logout"
              onClick={() => void handleLogout()}
            >
              ログアウト
            </button>
          </div>
        </aside>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
