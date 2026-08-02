"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MyPageAccordionSection,
  type MyPageAccordionProps,
} from "@/components/mypage/MyPageAccordionSection";
import {
  buildJobsSearchUrl,
  describeSearchHistory,
  loadSearchHistory,
  type SavedSearchFilters,
} from "@/lib/search-history";

export function MyPageSearchHistorySection({ open, onToggle }: MyPageAccordionProps) {
  const [searchHistory, setSearchHistory] = useState<SavedSearchFilters | null>(null);

  useEffect(() => {
    try {
      setSearchHistory(loadSearchHistory());
    } catch (error) {
      console.error("[mypage] search history load failed:", error);
    }
  }, []);

  const summary = searchHistory ? describeSearchHistory(searchHistory) : [];

  return (
    <MyPageAccordionSection
      title="最近の検索条件"
      open={open}
      onToggle={onToggle}
    >
      {summary.length === 0 ? (
        <p className="text-sm text-muted">保存された検索条件はありません。</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-charcoal">
          {summary.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-gold-dark">・</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
      {searchHistory && (
        <Link
          href={buildJobsSearchUrl(searchHistory)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark"
        >
          前回の条件で検索する
        </Link>
      )}
    </MyPageAccordionSection>
  );
}
