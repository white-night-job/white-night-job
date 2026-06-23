"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { BENEFIT_SEARCH_CATEGORIES } from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import { JOB_TYPES, type JobFilters } from "@/types/job";

const SALARY_OPTIONS = [
  { label: "指定なし", value: "all" },
  { label: "1,500円以上", value: "1500" },
  { label: "2,000円以上", value: "2000" },
  { label: "2,500円以上", value: "2500" },
  { label: "3,000円以上", value: "3000" },
  { label: "3,500円以上", value: "3500" },
  { label: "4,000円以上", value: "4000" },
  { label: "5,000円以上", value: "5000" },
];

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
          : "border border-gold/30 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
      }`}
    >
      {children}
    </button>
  );
}

type JobFilterSearchProps = {
  appliedFilters: JobFilters;
  onApply: (filters: JobFilters) => void;
};

export function JobFilterSearch({
  appliedFilters,
  onApply,
}: JobFilterSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentDistrict = appliedFilters.district ?? "all";
  const currentJobType = appliedFilters.jobType ?? "all";
  const currentQuery = appliedFilters.query ?? "";
  const currentMinSalary = appliedFilters.minSalary ?? "all";
  const currentBenefits = appliedFilters.benefits ?? [];
  const currentBenefitsKey = currentBenefits.join(",");
  const [keyword, setKeyword] = useState(currentQuery);
  const [draftDistrict, setDraftDistrict] = useState(currentDistrict);
  const [draftJobType, setDraftJobType] = useState(currentJobType);
  const [draftMinSalary, setDraftMinSalary] = useState(currentMinSalary);
  const [draftBenefits, setDraftBenefits] = useState<string[]>(currentBenefits);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setKeyword(currentQuery);
    setDraftDistrict(currentDistrict);
    setDraftJobType(currentJobType);
    setDraftMinSalary(currentMinSalary);
    setDraftBenefits(currentBenefitsKey ? currentBenefitsKey.split(",") : []);

    const hasAdvancedFilters =
      Boolean(currentQuery) ||
      currentMinSalary !== "all" ||
      currentBenefits.length > 0;
    if (hasAdvancedFilters) {
      setShowAdvanced(true);
    }
  }, [
    currentBenefits.length,
    currentBenefitsKey,
    currentDistrict,
    currentJobType,
    currentMinSalary,
    currentQuery,
  ]);

  function pushParams(filters: JobFilters) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.minSalary) params.set("minSalary", filters.minSalary);
    if (filters.district) params.set("district", filters.district);
    if (filters.jobType) params.set("jobType", filters.jobType);
    filters.benefits?.forEach((benefit) => params.append("benefit", benefit));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}#jobs-section` : `${pathname}#jobs-section`);
  }

  function toggleBenefit(benefit: string) {
    setDraftBenefits((benefits) =>
      benefits.includes(benefit)
        ? benefits.filter((item) => item !== benefit)
        : [...benefits, benefit],
    );
  }

  function resetFilters() {
    setKeyword("");
    setDraftDistrict("all");
    setDraftJobType("all");
    setDraftMinSalary("all");
    setDraftBenefits([]);
    setShowAdvanced(false);
  }

  function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextKeyword = keyword.trim();
    const nextFilters: JobFilters = {
      district: draftDistrict === "all" ? null : draftDistrict,
      jobType: draftJobType === "all" ? null : draftJobType,
      query: nextKeyword || null,
      minSalary: draftMinSalary === "all" ? null : draftMinSalary,
      benefits: draftBenefits,
    };

    onApply(nextFilters);
    pushParams(nextFilters);
  }

  function handleKeywordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSearch();
  }

  return (
    <div className="space-y-4">
      <section
        id="shop-search"
        className="scroll-mt-24 rounded-3xl border border-gold/25 bg-white p-4 shadow-[0_10px_35px_rgba(33,29,24,0.08)] sm:scroll-mt-28 sm:p-6"
      >
        <div className="mb-5">
          <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-gold-dark">
            SHOP SEARCH
          </p>
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            お店を探す
          </h2>
          <p className="mt-1 text-xs text-muted">
            エリアと職種でさっと探せます。細かい条件は「詳しく探す」から。
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-gold/15 bg-ivory/50 p-4">
            <p className="mb-1 text-xs font-medium text-gold-dark">エリア：札幌（固定）</p>
            <h3 className="mb-3 text-sm font-semibold text-charcoal">エリア</h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={draftDistrict === "all"}
                onClick={() => setDraftDistrict("all")}
              >
                すべて
              </FilterButton>
              {DISTRICTS.map((d) => (
                <FilterButton
                  key={d}
                  active={draftDistrict === d}
                  onClick={() => setDraftDistrict(d)}
                >
                  {d}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-ivory/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-charcoal">職種で探す</h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={draftJobType === "all"}
                onClick={() => setDraftJobType("all")}
              >
                すべて
              </FilterButton>
              {JOB_TYPES.map((type) => (
                <FilterButton
                  key={type}
                  active={draftJobType === type}
                  onClick={() => setDraftJobType(type)}
                >
                  {type}
                </FilterButton>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSearch()}
            className="min-h-12 w-full rounded-full border border-gold/50 bg-charcoal px-6 py-3 text-base font-semibold text-gold-light shadow-sm hover:bg-black sm:min-h-11 sm:text-sm"
          >
            検索する
          </button>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            aria-expanded={showAdvanced}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gold/35 bg-ivory px-4 py-2.5 text-sm font-semibold text-gold-dark transition hover:bg-gold-light/20"
          >
            詳しく探す
            <svg
              className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-5 space-y-5 border-t border-gold/15 pt-5">
            <div>
              <label htmlFor="shop-keyword" className="mb-2 block text-sm font-semibold text-charcoal">
                ワード検索
              </label>
              <form
                onSubmit={handleKeywordSubmit}
                className="grid gap-3 sm:grid-cols-[1fr_auto]"
              >
                <input
                  id="shop-keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="min-h-12 rounded-2xl border border-gold/30 bg-ivory px-4 py-3 text-base text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
                  placeholder="例：ロゼッタ、ニュークラ、送迎あり"
                />
                <button
                  type="submit"
                  className="min-h-12 rounded-full border border-gold/40 bg-ivory px-6 py-3 text-sm font-semibold text-gold-dark hover:bg-gold-light/20"
                >
                  ワードで検索
                </button>
              </form>
            </div>

            <div>
              <label htmlFor="minSalary" className="mb-2 block text-sm font-semibold text-charcoal">
                最低時給
              </label>
              <select
                id="minSalary"
                value={draftMinSalary}
                onChange={(event) => setDraftMinSalary(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-gold/30 bg-ivory px-4 py-3 text-base text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
              >
                {SALARY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-charcoal">待遇で絞り込む</p>
              {BENEFIT_SEARCH_CATEGORIES.map((category) => (
                <div key={category.title} className="rounded-2xl border border-gold/15 bg-ivory/70 p-3">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gold-dark">
                    {category.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((benefit) => {
                      const selected = draftBenefits.includes(benefit);
                      return (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() => toggleBenefit(benefit)}
                          className={`rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                            selected
                              ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
                              : "border-gold/30 bg-white text-muted hover:border-gold hover:bg-gold-light/20 hover:text-gold-dark"
                          }`}
                        >
                          {benefit}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-12 w-full rounded-full border border-gold/40 bg-ivory px-6 py-3 text-base font-semibold text-gold-dark hover:bg-gold-light/20 sm:min-h-11 sm:text-sm"
              >
                条件をリセット
              </button>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="min-h-12 w-full rounded-full border border-gold/50 bg-charcoal px-6 py-3 text-base font-semibold text-gold-light shadow-sm hover:bg-black sm:min-h-11 sm:text-sm"
              >
                検索する
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
