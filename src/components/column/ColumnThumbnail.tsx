import type { ColumnArticle } from "@/data/column-articles";

const toneClasses: Record<ColumnArticle["thumbnailTone"], string> = {
  gold: "bg-gradient-to-br from-gold-dark via-gold to-gold-mid",
  charcoal: "bg-gradient-to-br from-charcoal via-[#1c160c] to-[#302512]",
  champagne: "bg-gradient-to-br from-ivory via-champagne to-gold-mid",
};

type ColumnThumbnailProps = {
  title: string;
  tone: ColumnArticle["thumbnailTone"];
  className?: string;
};

export function ColumnThumbnail({ title, tone, className = "" }: ColumnThumbnailProps) {
  return (
    <div
      className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl ring-1 ring-gold/40 ring-inset ${toneClasses[tone]} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
      <p className="relative px-4 text-center font-serif text-sm font-semibold leading-relaxed tracking-wide text-white drop-shadow-sm sm:text-base">
        {title}
      </p>
    </div>
  );
}
