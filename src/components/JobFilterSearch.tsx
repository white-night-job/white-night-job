"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { BENEFIT_SEARCH_CATEGORIES } from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import { JOB_TYPES } from "@/types/job";

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
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
          : "border border-gold/30 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
      }`}
    >
      {children}
    </button>
  );
}

export function JobFilterSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDistrict = searchParams.get("district") ?? "all";
  const currentJobType = searchParams.get("jobType") ?? "all";
  const currentQuery = searchParams.get("q") ?? "";
  const currentMinSalary = searchParams.get("minSalary") ?? "all";
  const currentBenefits = searchParams.getAll("benefit");
  const [keyword, setKeyword] = useState(currentQuery);

  useEffect(() => {
    setKeyword(currentQuery);
  }, [currentQuery]);

  function pushParams(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${pathname}?${query}#jobs-section` : `${pathname}#jobs-section`);
  }

  function updateParam(key: "district" | "jobType", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    pushParams(params);
  }

  function updateMinSalary(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("minSalary");
    else params.set("minSalary", value);
    pushParams(params);
  }

  function toggleBenefit(benefit: string) {
    const params = new URLSearchParams(searchParams.toString());
    const benefits = params.getAll("benefit");
    params.delete("benefit");
    const nextBenefits = benefits.includes(benefit)
      ? benefits.filter((item) => item !== benefit)
      : [...benefits, benefit];
    nextBenefits.forEach((item) => params.append("benefit", item));
    pushParams(params);
  }

  function resetFilters() {
    setKeyword("");
    router.push(`${pathname}#jobs-section`);
  }

  function handleKeywordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const nextKeyword = keyword.trim();
    if (nextKeyword) params.set("q", nextKeyword);
    else params.delete("q");
    pushParams(params);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gold/30 bg-charcoal p-4 shadow-gold sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gold-light">
              店舗名・待遇で探す
            </h2>
            <p className="mt-1 text-xs text-white/65">
              店舗名、職種、エリア、待遇をまとめて検索できます。
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold-light hover:bg-gold/10"
          >
            条件をリセット
          </button>
        </div>

        <form onSubmit={handleKeywordSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="min-h-12 rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            placeholder="例：ロゼッタ、ニュークラ、送迎あり"
          />
          <button
            type="submit"
            className="min-h-12 rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-md"
          >
            検索する
          </button>
        </form>

        <div className="mt-4">
          <label htmlFor="minSalary" className="mb-2 block text-sm font-semibold text-gold-light">
            最低時給
          </label>
          <select
            id="minSalary"
            value={currentMinSalary}
            onChange={(event) => updateMinSalary(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          >
            {SALARY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-sm font-semibold text-gold-light">待遇で絞り込む</p>
          {BENEFIT_SEARCH_CATEGORIES.map((category) => (
            <div key={category.title}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-white/70">
                {category.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {category.items.map((benefit) => {
                  const selected = currentBenefits.includes(benefit);
                  return (
                    <button
                      key={benefit}
                      type="button"
                      onClick={() => toggleBenefit(benefit)}
                      className={`rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                        selected
                          ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
                          : "border-gold/35 bg-white/10 text-white/80 hover:border-gold hover:bg-gold/10 hover:text-gold-light"
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
      </section>
      <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
        <p className="mb-3 text-sm font-semibold text-charcoal">エリア：札幌（固定）</p>
        <h2 className="mb-3 text-sm font-semibold text-charcoal">地区で探す</h2>
        <div className="flex flex-wrap gap-2">
          <FilterButton active={currentDistrict === "all"} onClick={() => updateParam("district", "all")}>
            すべて
          </FilterButton>
          {DISTRICTS.map((d) => (
            <FilterButton
              key={d}
              active={currentDistrict === d}
              onClick={() => updateParam("district", d)}
            >
              {d}
            </FilterButton>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-charcoal">職種で探す</h2>
        <div className="flex flex-wrap gap-2">
          <FilterButton active={currentJobType === "all"} onClick={() => updateParam("jobType", "all")}>
            すべて
          </FilterButton>
          {JOB_TYPES.map((type) => (
            <FilterButton
              key={type}
              active={currentJobType === type}
              onClick={() => updateParam("jobType", type)}
            >
              {type}
            </FilterButton>
          ))}
        </div>
      </section>
    </div>
  );
}
