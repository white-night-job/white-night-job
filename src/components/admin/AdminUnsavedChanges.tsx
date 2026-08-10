"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type PendingNavigation =
  | { kind: "href"; href: string; targetBlank?: boolean }
  | { kind: "action"; run: () => void };

type AdminUnsavedChangesContextValue = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** dirty なら確認ダイアログ。false を返すと呼び出し側は遷移を止める */
  requestNavigation: (pending: PendingNavigation) => boolean;
};

const AdminUnsavedChangesContext =
  createContext<AdminUnsavedChangesContextValue | null>(null);

export function useAdminUnsavedChanges() {
  const ctx = useContext(AdminUnsavedChangesContext);
  if (!ctx) {
    return {
      isDirty: false,
      setDirty: () => undefined,
      requestNavigation: () => true,
    } satisfies AdminUnsavedChangesContextValue;
  }
  return ctx;
}

const CONFIRM_MESSAGE =
  "入力内容が保存されていません。このページを離れると入力内容が失われます。移動してもよろしいですか？";

export function AdminUnsavedChangesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const [isDirty, setIsDirty] = useState(false);
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const dirtyRef = useRef(false);
  const bypassRef = useRef(false);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    setIsDirty(dirty);
  }, []);

  const executePending = useCallback(
    (nav: PendingNavigation) => {
      bypassRef.current = true;
      dirtyRef.current = false;
      setIsDirty(false);
      setPending(null);
      if (nav.kind === "action") {
        nav.run();
        return;
      }
      if (nav.targetBlank) {
        window.open(nav.href, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(nav.href);
    },
    [router],
  );

  // 遷移完了後に bypass を解除
  useEffect(() => {
    bypassRef.current = false;
  }, [pathname]);

  const requestNavigation = useCallback((nav: PendingNavigation) => {
    if (!dirtyRef.current || bypassRef.current) {
      return true;
    }
    setPending(nav);
    return false;
  }, []);

  // ブラウザ更新・タブ閉じ
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || bypassRef.current) return;
      event.preventDefault();
      event.returnValue = CONFIRM_MESSAGE;
      return CONFIRM_MESSAGE;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // 同一オリジンの <a> クリックを捕捉（管理画面内リンクなど）
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (!dirtyRef.current || bypassRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset.unsavedIgnore === "true") return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      const current = new URL(window.location.href);
      const isExternal = url.origin !== current.origin;
      const samePath =
        url.pathname === current.pathname &&
        url.search === current.search &&
        url.hash === current.hash;
      if (!isExternal && samePath) return;

      const targetBlank = anchor.target === "_blank";

      // target=_blank（サイトを見る等）も確認対象
      event.preventDefault();
      event.stopPropagation();
      setPending({
        kind: "href",
        href: isExternal
          ? url.toString()
          : `${url.pathname}${url.search}${url.hash}`,
        targetBlank: isExternal || targetBlank,
      });
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  // ブラウザ戻る（可能な範囲で）
  useEffect(() => {
    if (!isDirty) return;
    const state = { adminUnsavedGuard: true, path: pathname };
    window.history.pushState(state, "", window.location.href);

    const onPopState = () => {
      if (!dirtyRef.current || bypassRef.current) return;
      window.history.pushState(state, "", window.location.href);
      setPending({
        kind: "action",
        run: () => {
          bypassRef.current = true;
          dirtyRef.current = false;
          setIsDirty(false);
          // pushState で積んだガード分を含めて戻る
          window.history.go(-2);
        },
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isDirty, pathname]);

  const value = useMemo(
    () => ({ isDirty, setDirty, requestNavigation }),
    [isDirty, setDirty, requestNavigation],
  );

  return (
    <AdminUnsavedChangesContext.Provider value={value}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-unsaved-title"
        >
          <div className="w-full max-w-md rounded-xl border border-gold/30 bg-white p-5 shadow-lg">
            <h2
              id="admin-unsaved-title"
              className="text-lg font-semibold text-charcoal"
            >
              未保存の入力があります
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal">
              {CONFIRM_MESSAGE}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-charcoal/25 px-4 py-2 text-xs font-medium text-charcoal"
                onClick={() => setPending(null)}
              >
                入力を続ける
              </button>
              <button
                type="button"
                className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-xs font-semibold text-white"
                onClick={() => executePending(pending)}
              >
                保存せず移動
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminUnsavedChangesContext.Provider>
  );
}
