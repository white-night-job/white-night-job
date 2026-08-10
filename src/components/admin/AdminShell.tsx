"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

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
  const isLoginPage = pathname === "/admin/login";
  const isDashboard = pathname === "/admin";

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
        {isDashboard ? (
          <div className="admin-topbar-brand">
            <span className="admin-topbar-kicker">Admin</span>
            <span className="admin-topbar-title">White Night Job 管理画面</span>
          </div>
        ) : (
          <Link href="/admin" className="admin-topbar-back">
            ← 管理画面
          </Link>
        )}
        <div className="admin-topbar-actions">
          <AdminNotificationBell />
          <Link
            href="/"
            className="admin-topbar-site"
            target="_blank"
            rel="noopener noreferrer"
          >
            サイトを見る
          </Link>
          <button
            type="button"
            className="admin-topbar-logout"
            onClick={() => void handleLogout()}
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="admin-body">
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
