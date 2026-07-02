/** White Night Job — ラグジュアリー共通スタイル */

export type LuxuryTheme = "light" | "dark" | "premium";

export const luxuryGoldGradient =
  "bg-gradient-to-r from-gold-dark via-gold to-gold-mid";

export const luxuryGoldGradientHover =
  "hover:bg-gradient-to-r hover:from-gold hover:via-gold-mid hover:to-gold-light";

export const luxuryMetalBtn = [
  "btn-gold-metal",
  "relative overflow-hidden",
  "font-semibold text-charcoal",
  "transition-all duration-200 active:scale-[0.99]",
].join(" ");

export const luxuryBtnPrimary = luxuryMetalBtn;

export const luxuryBtnPrimaryOnDark = luxuryMetalBtn;

export const luxurySectionHeading = [
  "flex items-center gap-3",
  "font-serif text-lg font-semibold text-charcoal sm:text-xl",
  "before:block before:h-5 before:w-1 before:shrink-0 before:rounded-full",
  "before:bg-gradient-to-b before:from-gold-dark before:via-gold before:to-gold-mid",
].join(" ");

export const luxuryPremiumHeading = [
  "listing-section-heading",
  "font-serif text-xl font-semibold tracking-wide text-[#111111] sm:text-2xl",
  "before:block before:h-5 before:w-px before:shrink-0 before:bg-[#C4A574]",
].join(" ");

export const luxuryDarkSectionHeading = luxuryPremiumHeading;

export const luxuryCardSurface = [
  "relative overflow-hidden",
  "border border-gold/45",
  "bg-gradient-to-br from-white via-ivory to-champagne",
  "shadow-luxury",
].join(" ");

export const luxuryPremiumCard = [
  "relative overflow-hidden",
  "border border-gold/55",
  "bg-gradient-to-br from-white via-ivory via-50% to-[#F5E4B8]",
  "shadow-luxury-lg",
  "after:pointer-events-none after:absolute after:inset-0",
  "after:bg-[linear-gradient(135deg,rgba(255,255,255,0.65)_0%,transparent_45%,rgba(249,231,165,0.25)_100%)]",
].join(" ");

export const luxuryPremiumPanel = [
  "relative overflow-hidden",
  "border-2 border-gold/60",
  "bg-gradient-to-br from-white via-ivory to-[#F3DFA8]",
  "shadow-luxury-lg",
  "after:pointer-events-none after:absolute after:inset-0",
  "after:bg-[linear-gradient(120deg,rgba(255,255,255,0.75)_0%,transparent_42%,rgba(230,193,90,0.3)_100%)]",
].join(" ");

export const luxuryDarkCard = luxuryPremiumCard;

export const luxurySectionDivider = "border-t border-gold/35";

export const luxuryDarkSectionDivider = "border-t border-gold/40";

export const luxuryImageFrame =
  "overflow-hidden rounded-xl ring-2 ring-gold/50 ring-inset shadow-image-3d";

export const luxuryDarkImageFrame = luxuryImageFrame;

export const luxuryPremiumImageFrame = luxuryImageFrame;

export const luxuryIconGold = "text-gold-mid";

export const luxurySalaryBadge = [
  "inline-block rounded-full border border-gold/55",
  "bg-gradient-to-r from-gold-dark via-gold to-gold-mid",
  "px-2 py-0.5 font-bold text-white shadow-metal",
].join(" ");

export const luxuryDarkInput = [
  "rounded-2xl border border-gold/40 bg-white/90",
  "px-4 py-2.5 text-base text-charcoal",
  "outline-none focus:border-gold focus:ring-2 focus:ring-gold/25",
].join(" ");

export const luxuryPremiumInput = luxuryDarkInput;

export function sectionHeading(theme: LuxuryTheme = "light") {
  if (theme === "premium" || theme === "dark") return luxuryPremiumHeading;
  return luxurySectionHeading;
}

export function cardSurface(theme: LuxuryTheme = "light") {
  if (theme === "premium" || theme === "dark") return luxuryPremiumCard;
  return luxuryCardSurface;
}

export function isPremiumTheme(theme: LuxuryTheme = "light") {
  return theme === "premium" || theme === "dark";
}
