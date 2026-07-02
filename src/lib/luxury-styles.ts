/** White Night Job — ラグジュアリー共通スタイル */

export type LuxuryTheme = "light" | "dark";

export const luxuryGoldGradient =
  "bg-gradient-to-r from-gold-dark via-gold to-gold-mid";

export const luxuryGoldGradientHover =
  "hover:bg-gradient-to-r hover:from-gold hover:via-gold-mid hover:to-gold-light";

export const luxuryMetalBtn = [
  "btn-gold-metal",
  "font-semibold text-void",
  "transition-all duration-200 active:scale-[0.99]",
].join(" ");

export const luxuryBtnPrimary = [
  luxuryMetalBtn,
].join(" ");

export const luxuryBtnPrimaryOnDark = luxuryMetalBtn;

export const luxurySectionHeading = [
  "flex items-center gap-3",
  "font-serif text-lg font-semibold text-charcoal sm:text-xl",
  "before:block before:h-5 before:w-1 before:shrink-0 before:rounded-full",
  "before:bg-gradient-to-b before:from-gold-dark before:via-gold before:to-gold-mid",
].join(" ");

export const luxuryDarkSectionHeading = [
  "flex items-center gap-3",
  "font-serif text-lg font-semibold sm:text-xl",
  "text-gradient-gold",
  "before:block before:h-5 before:w-1 before:shrink-0 before:rounded-full",
  "before:bg-gradient-to-b before:from-gold-dark before:via-gold-mid before:to-gold-light",
].join(" ");

export const luxuryCardSurface = [
  "border border-gold/35",
  "bg-gradient-to-br from-ivory via-[#FFF9EE] to-[#F8F0DC]",
  "shadow-luxury",
].join(" ");

export const luxuryDarkCard = [
  "border border-gold/50",
  "bg-gradient-to-br from-charcoal via-[#141210] to-void",
  "shadow-luxury",
].join(" ");

export const luxurySectionDivider = "border-t border-gold/30";

export const luxuryDarkSectionDivider = "border-t border-gold/40";

export const luxuryImageFrame = "ring-1 ring-gold/40 ring-inset";

export const luxuryDarkImageFrame =
  "rounded-xl ring-2 ring-gold/45 ring-inset overflow-hidden";

export const luxuryIconGold = "text-gold-mid";

export const luxuryDarkInput = [
  "rounded-2xl border border-gold/40 bg-void/80",
  "px-4 py-2.5 text-base text-white/90",
  "outline-none focus:border-gold-mid focus:ring-2 focus:ring-gold/25",
].join(" ");

export function sectionHeading(theme: LuxuryTheme = "light") {
  return theme === "dark" ? luxuryDarkSectionHeading : luxurySectionHeading;
}

export function cardSurface(theme: LuxuryTheme = "light") {
  return theme === "dark" ? luxuryDarkCard : luxuryCardSurface;
}
