/** White Night Job — ラグジュアリー共通スタイル */

export const luxuryGoldGradient = "bg-gradient-to-r from-gold-dark via-gold to-gold-mid";

export const luxuryGoldGradientHover =
  "hover:bg-gradient-to-r hover:from-gold hover:via-gold-mid hover:to-gold-light";

export const luxuryBtnPrimary = [
  luxuryGoldGradient,
  luxuryGoldGradientHover,
  "font-semibold text-charcoal shadow-luxury",
  "transition-all duration-200 hover:brightness-105 active:scale-[0.99]",
].join(" ");

export const luxuryBtnPrimaryOnDark = [
  luxuryGoldGradient,
  luxuryGoldGradientHover,
  "font-semibold text-white shadow-luxury",
  "transition-all duration-200 hover:brightness-110 active:scale-[0.99]",
].join(" ");

export const luxurySectionHeading = [
  "flex items-center gap-3",
  "font-serif text-lg font-semibold text-charcoal sm:text-xl",
  "before:block before:h-5 before:w-1 before:shrink-0 before:rounded-full",
  "before:bg-gradient-to-b before:from-gold-dark before:via-gold before:to-gold-mid",
].join(" ");

export const luxuryCardSurface = [
  "border border-gold/35",
  "bg-gradient-to-br from-[#FFFDF8] via-[#FFF9EE] to-[#F8F0DC]",
  "shadow-luxury",
].join(" ");

export const luxurySectionDivider = "border-t border-gold/30";

export const luxuryImageFrame = "ring-1 ring-gold/40 ring-inset";

export const luxuryIconGold = "text-gold";
