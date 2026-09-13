"use client";

import { getDisplayJobFaqs } from "@/lib/job-db";
import type { Job } from "@/types/job";

export function JobFaqSection({ job }: { job: Job }) {
  const faqs = getDisplayJobFaqs(job);
  if (faqs.length === 0) return null;

  return (
    <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-white to-ivory p-4 shadow-[0_8px_28px_rgba(201,169,98,0.12)] sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-charcoal">
        <span className="text-gold-dark">◆</span>
        よくある質問
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <details
            key={`${index}:${faq.question}`}
            className="group rounded-2xl border border-gold/20 bg-white px-3.5 py-1 open:pb-3"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-left text-sm font-semibold text-charcoal marker:content-none [&::-webkit-details-marker]:hidden sm:text-base">
              <span className="min-w-0 flex-1 leading-snug">{faq.question}</span>
              <span
                className="shrink-0 text-gold-dark transition group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </summary>
            <p className="whitespace-pre-wrap border-t border-gold/10 pt-2.5 text-sm leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
