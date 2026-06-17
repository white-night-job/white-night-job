import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export function LegalDocument({
  title,
  description,
  updatedAt,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-muted hover:text-gold-dark"
        >
          ← トップページへ
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <p className="mt-2 text-xs text-muted">最終更新日：{updatedAt}</p>
      </div>

      <article className="space-y-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal sm:text-xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-charcoal/90">
              {section.content}
            </div>
          </section>
        ))}
      </article>

      <nav className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
        <Link href="/terms" className="hover:text-gold-dark">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:text-gold-dark">
          プライバシーポリシー
        </Link>
        <Link href="/legal" className="hover:text-gold-dark">
          特定商取引法に基づく表記
        </Link>
      </nav>
    </div>
  );
}
