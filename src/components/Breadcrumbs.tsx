import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo";
import { SITE_BRAND_JA } from "@/lib/site";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const trail =
    items[0]?.label === SITE_BRAND_JA
      ? items
      : [{ label: SITE_BRAND_JA, href: "/" }, ...items];

  return (
    <nav aria-label="パンくずリスト" className="mb-4">
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden className="text-gold/50">/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-gold-dark">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-charcoal" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
