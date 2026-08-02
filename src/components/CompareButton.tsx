"use client";

import type { MouseEvent } from "react";
import { useCompare } from "@/components/CompareProvider";

type CompareButtonProps = {
  jobId: string;
  className?: string;
  /** chip: カード用 / detail: 詳細ページ用 */
  variant?: "chip" | "detail";
};

export function CompareButton({
  jobId,
  className = "",
  variant = "chip",
}: CompareButtonProps) {
  const { isCompared, toggleCompare } = useCompare();
  const added = isCompared(jobId);

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleCompare(jobId);
  }

  const base =
    variant === "detail"
      ? "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition"
      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur transition";

  const stateClass = added
    ? "border border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-gold"
    : "border border-gold/45 bg-white text-gold-dark hover:border-gold";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={added}
      aria-label={added ? "比較中（タップで外す）" : "比較する"}
      className={[base, stateClass, className].filter(Boolean).join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border text-[9px] leading-none",
          added
            ? "border-white/80 bg-white text-gold-dark"
            : "border-gold/60 bg-white text-transparent",
        ].join(" ")}
      >
        ✓
      </span>
      {added
        ? variant === "detail"
          ? "比較中"
          : "比較中"
        : variant === "detail"
          ? "比較に追加"
          : "比較する"}
    </button>
  );
}
