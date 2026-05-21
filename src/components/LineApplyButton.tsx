export function LineApplyButton({
  lineUrl,
  label = "LINEで応募する",
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
