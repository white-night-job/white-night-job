"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HeaderLoginModal } from "@/components/HeaderLoginModal";
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
  const { isLoggedIn, ready } = useUserSession();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const lineLoginRedirect = pathname || "/";
  const triggerLabel = isLoggedIn ? "マイページ" : "ログイン";

  function handleTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    window.dispatchEvent(new CustomEvent("wn:close-chat"));

    if (!ready) return;
    if (isLoggedIn) {
      router.push("/mypage");
      return;
    }
    setLoginModalOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-expanded={!isLoggedIn ? loginModalOpen : undefined}
        aria-controls={!isLoggedIn ? "header-login-modal-title" : undefined}
        aria-label={triggerLabel}
        className={`header-icon-btn header-account-btn ${isLoggedIn ? "is-logged-in" : ""} ${!ready ? "opacity-80" : ""}`}
      >
        <AccountIcon />
        <span className="header-account-btn-label">{triggerLabel}</span>
      </button>

      {!isLoggedIn && (
        <HeaderLoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          redirectPath={lineLoginRedirect}
        />
      )}
    </>
  );
}
