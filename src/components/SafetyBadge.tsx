export function SafetyBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "sm" ? "h-5 w-5 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gradient-to-r from-gold-light/30 to-white px-2 py-0.5">
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark font-bold text-white ${sizeClass}`}
      >
        ✓
      </span>
      <span className="text-xs font-medium text-gold-dark sm:text-sm">安心認証</span>
    </span>
  );
}
