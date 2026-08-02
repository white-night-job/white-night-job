"use client";

import type { ReactNode } from "react";

export type MyPageAccordionProps = {
  open: boolean;
  onToggle: () => void;
};

type MyPageAccordionSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** タイトル横に置く操作（リンク等）。トグルとは独立して動作する。 */
  headerAside?: ReactNode;
  /**
   * card: 既存の白カード枠付きセクション向け
   * plain: お気に入りなど、中身側に枠があるセクション向け
   */
  variant?: "card" | "plain";
};

/**
 * マイページ用アコーディオン枠。タイトル行の見た目は既存 h2 を踏襲し、
 * 開閉だけを追加する。
 */
export function MyPageAccordionSection({
  title,
  open,
  onToggle,
  children,
  headerAside,
  variant = "card",
}: MyPageAccordionSectionProps) {
  const header = (
    <div
      className={
        variant === "plain"
          ? "mb-0 flex flex-wrap items-center justify-between gap-3"
          : "flex flex-wrap items-center justify-between gap-3"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <h2 className="font-serif text-lg font-semibold text-charcoal">{title}</h2>
        <span
          className="shrink-0 text-sm text-gold-dark"
          aria-hidden="true"
        >
          {open ? "▼" : "▶"}
        </span>
      </button>
      {headerAside ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{headerAside}</div>
      ) : null}
    </div>
  );

  if (variant === "plain") {
    return (
      <section className="mt-5">
        {header}
        {open ? <div className="mt-3">{children}</div> : null}
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
      {header}
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
