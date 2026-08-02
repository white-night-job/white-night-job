"use client";

import type { MouseEvent } from "react";
import { useCompare } from "@/components/CompareProvider";

type CompareButtonProps = {
  jobId: string;
  className?: string;
  /** chip: カード用チェック風 / detail: 詳細ページ用ラベル */
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

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={added}
        className={[
          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
          added
            ? "border border-charcoal bg-charcoal text-gold-light"
            : "border border-gold/40 bg-white text-gold-dark hover:bg-ivory",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {added ? "比較中" : "比較に追加"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={added}
      aria-label={added ? "比較中（タップで外す）" : "比較する"}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur transition",
        added
          ? "border border-charcoal bg-charcoal text-gold-light"
          : "border border-gold/45 bg-white/95 text-gold-dark hover:border-gold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border text-[9px] leading-none",
          added
            ? "border-gold bg-gold text-charcoal"
            : "border-gold/60 bg-white text-transparent",
        ].join(" ")}
      >
        ✓
      </span>
      {added ? "比較中" : "比較する"}
    </button>
  );
}
