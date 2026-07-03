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
      <span className="hero-safety-badge inline-flex items-center gap-1.5 rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5">
        <span className="hero-safety-check inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] text-[11px] font-bold sm:h-5 sm:w-5 sm:text-xs">
          ✓
        </span>
        <span className="hero-safety-label text-[13px] font-semibold tracking-[0.06em] sm:text-sm">
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
