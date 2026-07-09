"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";

function AccountIcon() {
  return (
    <span className="text-base leading-none" aria-hidden>
      👤
    </span>
  );
}

export function HeaderAccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, ready, refreshSession } = useUserSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const lineLoginRedirect =
    pathname === "/" || !pathname ? "/mypage" : pathname;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (!open) return;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleLogout() {
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    await refreshSession();
    setOpen(false);
    router.push("/");
  }

  const triggerLabel = isLoggedIn ? "マイページ" : "アカウント";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="header-account-menu"
        aria-label={triggerLabel}
        className={`header-account-btn ${isLoggedIn ? "is-logged-in" : ""} ${!ready ? "opacity-80" : ""}`}
      >
        <AccountIcon />
        <span className="header-account-btn-label">{triggerLabel}</span>
      </button>

      {open && ready && (
        <>
          <button
            type="button"
            aria-label="アカウントメニューを閉じる"
            className="fixed inset-0 z-40 bg-charcoal/15"
            onClick={() => setOpen(false)}
          />
          <nav id="header-account-menu" className="header-account-panel">
            {isLoggedIn ? (
              <ul className="header-account-list">
                <li>
                  <Link
                    href="/mypage"
                    onClick={() => setOpen(false)}
                    className="header-account-item"
                  >
                    マイページ
                  </Link>
                </li>
                <li className="header-account-divider" aria-hidden />
                <li>
                  <Link
                    href="/mypage/favorites"
                    onClick={() => setOpen(false)}
                    className="header-account-item"
                  >
                    お気に入り
                  </Link>
                </li>
                <li className="header-account-divider" aria-hidden />
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="header-account-item w-full text-left"
                  >
                    ログアウト
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="header-account-list">
                <li>
                  <a
                    href={`/api/line/login?redirect=${encodeURIComponent(lineLoginRedirect)}`}
                    className="header-account-item header-account-item-line"
                    onClick={() => setOpen(false)}
                  >
                    LINEでログイン
                  </a>
                </li>
                <li className="header-account-divider" aria-hidden />
                <li>
                  <Link
                    href="/#first-time-guide"
                    onClick={() => setOpen(false)}
                    className="header-account-item"
                  >
                    初めての方へ
                  </Link>
                </li>
              </ul>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
