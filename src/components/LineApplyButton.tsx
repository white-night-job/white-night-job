export function LineApplyButton({
  lineUrl,
  label = "LINEで相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  lineUrl: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";

  return (
    <a
      href={lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#06C755] font-semibold text-white shadow-md hover:bg-[#05b34c] ${sizeClass} ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </a>
  );
}

export function PhoneApplyButton({
  phone,
  label = "電話で相談・応募する",
  fullWidth = false,
  size = "md",
}: {
  phone: string;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "px-8 py-4 text-lg" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";
  const tel = phone.replace(/[^\d+]/g, "");

  return (
    <a
      href={`tel:${tel}`}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gradient-to-r from-charcoal to-gold-dark font-semibold text-white shadow-md hover:from-gold-dark hover:to-charcoal ${sizeClass} ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </a>
  );
}
