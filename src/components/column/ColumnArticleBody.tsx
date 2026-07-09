import Link from "next/link";
import type { ColumnSection } from "@/data/column-articles";

type ColumnArticleBodyProps = {
  sections: ColumnSection[];
};

export function ColumnArticleBody({ sections }: ColumnArticleBodyProps) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="font-serif text-xl font-semibold text-charcoal sm:text-2xl">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-8 text-charcoal/90 sm:text-base sm:leading-9">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {section.links && section.links.length > 0 && (
            <ul className="mt-4 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
