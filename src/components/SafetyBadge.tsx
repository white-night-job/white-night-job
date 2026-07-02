export function SafetyBadge({
  size = "md",
  variant = "default",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "hero";
}) {
  const sizeClass =
    size === "sm" ? "h-5 w-5 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";

  const isHero = variant === "hero";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
        isHero
          ? "border-gold-light/50 bg-black/25 backdrop-blur-sm"
          : "border-gold/40 bg-gradient-to-r from-gold-light/30 to-white"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark font-bold text-white ${sizeClass}`}
      >
        ✓
      </span>
      <span
        className={`text-xs font-medium sm:text-sm ${
          isHero ? "text-gold-light" : "text-gold-dark"
        }`}
      >
        安心認証
      </span>
    </span>
  );
}
