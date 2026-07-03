function CrownMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 17h16M6 17l1.2-7.2 3.3 3.6 2.5-6.2 2.5 6.2 3.3-3.6L18 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17v1.5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SafetyBadge({
  size = "md",
  variant = "default",
}: {
  size?: "xxs" | "xs" | "sm" | "md" | "lg";
  variant?: "default" | "hero";
}) {
  const sizeClass =
    size === "xxs"
      ? "h-3 w-3 text-[7px]"
      : size === "xs"
        ? "h-3.5 w-3.5 text-[8px]"
        : size === "sm"
          ? "h-4 w-4 text-[9px]"
          : size === "lg"
            ? "h-10 w-10 text-sm"
            : "h-7 w-7 text-xs";

  const isHero = variant === "hero";

  if (isHero) {
    return (
      <span className="hero-safety-badge inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1">
        <CrownMark className="hero-safety-crown h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        <span className="hero-safety-check inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] text-[9px] font-bold sm:h-4 sm:w-4 sm:text-[10px]">
          ✓
        </span>
        <span className="hero-safety-label text-[10px] font-semibold tracking-[0.06em] sm:text-[11px]">
          安心認証
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-gold/40 bg-gradient-to-r from-gold-light/30 to-white px-1.5 py-0.5">
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark font-bold text-white ${sizeClass}`}
      >
        ✓
      </span>
      <span className="text-[10px] font-medium text-gold-dark sm:text-xs">
        安心認証
      </span>
    </span>
  );
}
