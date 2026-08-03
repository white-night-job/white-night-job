import Link from "next/link";

const AREA_LINKS = [
  { href: "/sapporo/susukino", label: "すすきのの夜職求人" },
  { href: "/sapporo/kotoni", label: "琴似の夜職求人" },
  { href: "/sapporo/kita24jo", label: "北24条の夜職求人" },
  { href: "/sapporo/teine", label: "手稲の夜職求人" },
] as const;

/** Lightweight SEO internal links for shop search / area entry points. */
export function SusukinoSeoLinks({
  className = "",
  showPrefix = true,
}: {
  className?: string;
  showPrefix?: boolean;
}) {
  if (showPrefix) {
    return (
      <p className={`text-sm leading-6 text-muted ${className}`}>
        エリア特集：
        {AREA_LINKS.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? (
              <span className="mx-1.5 text-gold/40" aria-hidden>
                ·
              </span>
            ) : null}
            <Link
              href={link.href}
              className={`${index === 0 ? "ml-1 " : ""}font-medium text-gold-dark underline-offset-2 hover:underline`}
            >
              {link.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <nav
      aria-label="エリアから探す"
      className={`text-sm leading-7 text-muted ${className}`}
    >
      <p className="mb-2 text-xs font-semibold tracking-wide text-gold-dark">
        エリアから探す
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-2">
        {AREA_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-medium text-gold-dark underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
