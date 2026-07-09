import type { ColumnSection } from "@/data/column-articles";

type ColumnTableOfContentsProps = {
  sections: ColumnSection[];
};

export function ColumnTableOfContents({ sections }: ColumnTableOfContentsProps) {
  return (
    <nav
      aria-label="目次"
      className="rounded-2xl border border-gold/30 bg-white/80 p-4 shadow-gold sm:p-5"
    >
      <h2 className="font-serif text-base font-semibold text-charcoal">目次</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              {index + 1}. {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
