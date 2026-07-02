export function SafetyBadge({
  size = "md",
  variant = "default",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "hero";
}) {
  const sizeClass =
    size === "sm" ? "h-4 w-4 text-[9px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";

  const isHero = variant === "hero";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${
        isHero
          ? "border-[#E4D4BC]/50 bg-[#111111]/75 backdrop-blur-sm"
          : "border-gold/40 bg-gradient-to-r from-gold-light/30 to-white"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizeClass} ${
          isHero
            ? "bg-gradient-to-br from-[#C4A574] to-[#8B6F3E]"
            : "bg-gradient-to-br from-gold to-gold-dark"
        }`}
      >
        ✓
      </span>
      <span
        className={`text-[10px] font-medium sm:text-xs ${
          isHero ? "text-[#F5F0E8]" : "text-gold-dark"
        }`}
      >
        安心認証
      </span>
    </span>
  );
}
