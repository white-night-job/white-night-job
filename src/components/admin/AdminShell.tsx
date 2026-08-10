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
import {
  AdminUnsavedChangesProvider,
  useAdminUnsavedChanges,
} from "@/components/admin/AdminUnsavedChanges";

function AdminShellChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const { requestNavigation } = useAdminUnsavedChanges();
  const isDashboard = pathname === "/admin";

  async function handleLogout() {
    const proceed = requestNavigation({
      kind: "action",
      run: () => {
        void (async () => {
          try {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "include",
            });
          } catch {
            /* ignore */
          }
          router.replace("/admin/login");
        })();
      },
    });
    if (!proceed) return;
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    router.replace("/admin/login");
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
          <Link
            href="/admin"
            className="admin-topbar-back"
            onClick={(event) => {
              const ok = requestNavigation({
                kind: "href",
                href: "/admin",
              });
              if (!ok) event.preventDefault();
            }}
          >
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
            onClick={(event) => {
              const ok = requestNavigation({
                kind: "href",
                href: "/",
                targetBlank: true,
              });
              if (!ok) event.preventDefault();
            }}
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
    <AdminUnsavedChangesProvider>
      <AdminShellChrome>{children}</AdminShellChrome>
    </AdminUnsavedChangesProvider>
  );
}
