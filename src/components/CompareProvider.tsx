"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  COMPARE_CHANGED_EVENT,
  COMPARE_MAX,
  loadCompareJobIds,
  replaceCompareJobIds,
  toggleCompareJobId,
} from "@/lib/compare-jobs";

type CompareToast = {
  message: string;
  tone: "info" | "error" | "success";
};

type CompareContextValue = {
  jobIds: string[];
  count: number;
  isCompared: (jobId: string) => boolean;
  toggleCompare: (jobId: string) => { ok: boolean; action?: "added" | "removed" };
  setCompareIds: (jobIds: string[]) => void;
  showToast: (message: string, tone?: CompareToast["tone"]) => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [toast, setToast] = useState<CompareToast | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setJobIds(loadCompareJobIds());
    setReady(true);

    function onChanged(event: Event) {
      const detail = (event as CustomEvent<{ jobIds?: string[] }>).detail;
      if (detail?.jobIds) {
        setJobIds(detail.jobIds);
        return;
      }
      setJobIds(loadCompareJobIds());
    }

    function onStorage(event: StorageEvent) {
      if (event.key === "white-night-compare-jobs") {
        setJobIds(loadCompareJobIds());
      }
    }

    window.addEventListener(COMPARE_CHANGED_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMPARE_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const showToast = useCallback(
    (message: string, tone: CompareToast["tone"] = "info") => {
      setToast({ message, tone });
      window.setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 2600);
    },
    [],
  );

  const toggleCompare = useCallback(
    (jobId: string) => {
      const result = toggleCompareJobId(jobId);
      setJobIds(result.jobIds);
      if (!result.ok && result.reason === "full") {
        showToast("比較できるのは5店舗までです", "error");
        return { ok: false as const };
      }
      if (result.action === "added") {
        showToast("比較に追加しました", "success");
      }
      return { ok: true as const, action: result.action };
    },
    [showToast],
  );

  const setCompareIds = useCallback((ids: string[]) => {
    const next = replaceCompareJobIds(ids);
    setJobIds(next);
  }, []);

  const value = useMemo<CompareContextValue>(
    () => ({
      jobIds,
      count: jobIds.length,
      isCompared: (jobId: string) => jobIds.includes(jobId),
      toggleCompare,
      setCompareIds,
      showToast,
    }),
    [jobIds, setCompareIds, showToast, toggleCompare],
  );

  const hideBar =
    !ready ||
    jobIds.length === 0 ||
    pathname === "/compare" ||
    pathname.startsWith("/admin");

  useEffect(() => {
    document.body.classList.toggle("compare-bar-visible", !hideBar);
    return () => {
      document.body.classList.remove("compare-bar-visible");
    };
  }, [hideBar]);

  return (
    <CompareContext.Provider value={value}>
      {children}

      {!hideBar && (
        <div className="compare-fixed-bar">
          <div className="compare-fixed-bar-inner">
            {jobIds.length === 1 ? (
              <div className="rounded-full border border-gold/40 bg-charcoal/95 px-5 py-3.5 text-center text-sm font-semibold text-gold-light shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur">
                あと1店舗選択してください
                <span className="ml-2 text-xs font-medium text-white/70">
                  （1/{COMPARE_MAX}）
                </span>
              </div>
            ) : (
              <Link
                href="/compare"
                className="flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(168,130,45,0.45)]"
              >
                比較する（{jobIds.length}/{COMPARE_MAX}）
              </Link>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-20 z-[80] w-[min(92vw,22rem)] -translate-x-1/2 rounded-full px-4 py-2.5 text-center text-sm font-medium shadow-lg ${
            toast.tone === "error"
              ? "border border-red-300 bg-red-600 text-white"
              : toast.tone === "success"
                ? "border border-[#047a3b]/30 bg-[#047a3b] text-white"
                : "border border-gold/40 bg-charcoal text-gold-light"
          }`}
        >
          {toast.message}
        </div>
      )}
    </CompareContext.Provider>
  );
}
