export function SafetyBadge({
  size = "md",
  variant = "default",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "hero";
}) {
  const sizeClass =
    size === "xs"
      ? "h-3.5 w-3.5 text-[8px]"
      : size === "sm"
        ? "h-4 w-4 text-[9px]"
        : size === "lg"
          ? "h-10 w-10 text-sm"
          : "h-7 w-7 text-xs";

  const isHero = variant === "hero";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-sm px-1 py-px ${
        isHero
          ? "hero-safety-badge"
          : "rounded-full border border-gold/40 bg-gradient-to-r from-gold-light/30 to-white px-1.5 py-0.5"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-sm font-bold ${sizeClass} ${
          isHero
            ? "bg-[#8b6f3e]/18 text-[#5a4828]"
            : "rounded-full bg-gradient-to-br from-gold to-gold-dark text-white"
        }`}
      >
        ✓
      </span>
      <span
        className={`font-medium ${
          isHero ? "text-[9px] text-[#3d3020]/85" : "text-[10px] text-gold-dark sm:text-xs"
        }`}
      >
        安心認証
      </span>
    </span>
  );
}
