"use client";

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
  const searchParams = useSearchParams();
  const currentDistrict = searchParams.get("district") ?? "all";
  const currentJobType = searchParams.get("jobType") ?? "all";

  function updateParam(key: "district" | "jobType", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="space-y-4">
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
