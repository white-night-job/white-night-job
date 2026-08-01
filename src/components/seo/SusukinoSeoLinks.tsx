import Link from "next/link";

/** Lightweight SEO internal links for shop search / area entry points. */
export function SusukinoSeoLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm leading-6 text-muted ${className}`}>
      エリア特集：
      <Link
        href="/sapporo/susukino"
        className="ml-1 font-medium text-gold-dark underline-offset-2 hover:underline"
      >
        すすきのの夜職求人
      </Link>
      <span className="mx-1.5 text-gold/40" aria-hidden>
        ·
      </span>
      <Link
        href="/sapporo/kotoni"
        className="font-medium text-gold-dark underline-offset-2 hover:underline"
      >
        琴似の夜職求人
      </Link>
      <span className="mx-1.5 text-gold/40" aria-hidden>
        ·
      </span>
      <Link
        href="/sapporo/kita24jo"
        className="font-medium text-gold-dark underline-offset-2 hover:underline"
      >
        北24条の夜職求人
      </Link>
      <span className="mx-1.5 text-gold/40" aria-hidden>
        ·
      </span>
      <Link
        href="/sapporo/teine"
        className="font-medium text-gold-dark underline-offset-2 hover:underline"
      >
        手稲の夜職求人
      </Link>
    </p>
  );
}
