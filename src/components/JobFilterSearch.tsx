"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { DISTRICTS } from "@/data/districts";
import { JOB_TYPES } from "@/types/job";

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
  const [keyword, setKeyword] = useState(currentQuery);

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
      <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-charcoal">店舗名・待遇で探す</h2>
        <form onSubmit={handleKeywordSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="min-h-11 flex-1 rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            placeholder="例：ロゼッタ、ニュークラ、送迎あり"
          />
          <button
            type="submit"
            className="min-h-11 rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white shadow-md"
          >
            検索する
          </button>
        </form>
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
