"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeaderLoginModal } from "@/components/HeaderLoginModal";
import { useUserSession } from "@/components/UserSessionProvider";

function AccountIcon() {
  return (
    <span className="text-base leading-none" aria-hidden>
      👤
    </span>
  );
}

function buildLineLoginHref(redirectPath: string) {
  return `/api/line/login?redirect=${encodeURIComponent(redirectPath)}`;
}

export function HeaderAccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, ready, refreshSession } = useUserSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const lineLoginRedirect = pathname || "/";
  const lineLoginHref = buildLineLoginHref(lineLoginRedirect);

  useEffect(() => {
    setMenuOpen(false);
    setLoginModalOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (!menuOpen) return;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    await refreshSession();
    setMenuOpen(false);
    router.push("/");
  }

  function handleTriggerClick() {
    if (!ready) return;
    if (isLoggedIn) {
      setMenuOpen((current) => !current);
      return;
    }
    setLoginModalOpen(true);
  }

  const triggerLabel = isLoggedIn ? "マイページ" : "ログイン";

  return (
    <>
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={handleTriggerClick}
          aria-expanded={isLoggedIn ? menuOpen : loginModalOpen}
          aria-controls={isLoggedIn ? "header-account-menu" : "header-login-modal-title"}
          aria-label={triggerLabel}
          className={`header-account-btn ${isLoggedIn ? "is-logged-in" : ""} ${!ready ? "opacity-80" : ""}`}
        >
          <AccountIcon />
          <span className="header-account-btn-label">{triggerLabel}</span>
        </button>

        {menuOpen && ready && isLoggedIn && (
          <>
            <button
              type="button"
              aria-label="アカウントメニューを閉じる"
              className="fixed inset-0 z-40 bg-charcoal/15"
              onClick={() => setMenuOpen(false)}
            />
            <nav id="header-account-menu" className="header-account-panel">
              <ul className="header-account-list">
                <li>
                  <Link
                    href="/mypage"
                    onClick={() => setMenuOpen(false)}
                    className="header-account-item"
                  >
                    マイページ
                  </Link>
                </li>
                <li className="header-account-divider" aria-hidden />
                <li>
                  <Link
                    href="/mypage/favorites"
                    onClick={() => setMenuOpen(false)}
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
            </nav>
          </>
        )}
      </div>

      {!isLoggedIn && (
        <HeaderLoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          lineLoginHref={lineLoginHref}
        />
      )}
    </>
  );
}
