"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { BENEFIT_SEARCH_CATEGORIES } from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import {
  luxuryCardSurface,
  luxuryDarkCard,
  luxuryDarkInput,
  luxuryDarkSectionHeading,
  luxuryMetalBtn,
  luxurySectionHeading,
  type LuxuryTheme,
} from "@/lib/luxury-styles";
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

type PickerKey = "district" | "jobType" | "minSalary";

function FilterButton({
  active,
  onClick,
  children,
  isDark = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-void shadow-luxury-sm"
          : isDark
            ? "border border-gold/40 bg-void/60 text-white/70 hover:border-gold-mid hover:text-gold-light"
            : "border border-gold/35 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CompactPickerRow({
  label,
  value,
  open,
  onToggle,
  children,
  isDark = false,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}) {
  return (
    <div className={`border-b last:border-b-0 ${isDark ? "border-gold/25" : "border-gold/15"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-1 py-2.5 text-left"
      >
        <span
          className={`w-14 shrink-0 text-sm font-medium sm:w-16 ${
            isDark ? "text-gold-mid" : "text-muted"
          }`}
        >
          {label}
        </span>
        <span
          className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 text-sm font-semibold ${
            isDark ? "text-white/90" : "text-charcoal"
          }`}
        >
          <span className="truncate">{value}</span>
          <ChevronDown open={open} />
        </span>
      </button>
      {open && (
        <div
          className={`mb-2 rounded-xl border p-2 shadow-inner ${
            isDark
              ? "border-gold/35 bg-void/80"
              : "border-gold/20 bg-ivory/80"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type JobFilterSearchProps = {
  appliedFilters: JobFilters;
  onApply: (filters: JobFilters) => void;
  resultsPath?: string;
  theme?: LuxuryTheme;
};

export function JobFilterSearch({
  appliedFilters,
  onApply,
  resultsPath,
  theme = "light",
}: JobFilterSearchProps) {
  const isDark = theme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const pickerRef = useRef<HTMLDivElement>(null);
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
  const [openPicker, setOpenPicker] = useState<PickerKey | null>(null);

  useEffect(() => {
    setKeyword(currentQuery);
    setDraftDistrict(currentDistrict);
    setDraftJobType(currentJobType);
    setDraftMinSalary(currentMinSalary);
    setDraftBenefits(currentBenefitsKey ? currentBenefitsKey.split(",") : []);

    const hasAdvancedFilters =
      Boolean(currentQuery) || currentBenefits.length > 0;
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpenPicker(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  function pushParams(filters: JobFilters) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.minSalary) params.set("minSalary", filters.minSalary);
    if (filters.district) params.set("district", filters.district);
    if (filters.jobType) params.set("jobType", filters.jobType);
    filters.benefits?.forEach((benefit) => params.append("benefit", benefit));
    const query = params.toString();
    const targetPath = resultsPath ?? pathname;
    router.push(
      query ? `${targetPath}?${query}#jobs-section` : `${targetPath}#jobs-section`,
    );
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
    setOpenPicker(null);
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
    setOpenPicker(null);
  }

  function togglePicker(key: PickerKey) {
    setOpenPicker((current) => (current === key ? null : key));
  }

  function selectDistrict(value: string) {
    setDraftDistrict(value);
    setOpenPicker(null);
  }

  function selectJobType(value: string) {
    setDraftJobType(value);
    setOpenPicker(null);
  }

  function selectMinSalary(value: string) {
    setDraftMinSalary(value);
    setOpenPicker(null);
  }

  const districtLabel =
    draftDistrict === "all" ? "すべて" : draftDistrict;
  const jobTypeLabel =
    draftJobType === "all" ? "すべて" : draftJobType;
  const salaryLabel =
    SALARY_OPTIONS.find((option) => option.value === draftMinSalary)?.label ??
    "指定なし";

  return (
    <div className="space-y-4">
      <section
        id="shop-search"
        className={`scroll-mt-24 rounded-3xl p-4 sm:scroll-mt-28 sm:p-5 ${
          isDark ? luxuryDarkCard : luxuryCardSurface
        }`}
      >
        <div className="mb-3">
          <p className="mb-0.5 text-xs font-semibold tracking-[0.2em] text-gold-mid">
            SHOP SEARCH
          </p>
          <h2 className={isDark ? luxuryDarkSectionHeading : luxurySectionHeading}>
            お店を探す
          </h2>
        </div>

        <div
          ref={pickerRef}
          className={`rounded-2xl border px-3 py-1 ${
            isDark
              ? "border-gold/40 bg-void/50"
              : "border-gold/25 bg-ivory/80"
          }`}
        >
          <CompactPickerRow
            label="エリア"
            value={districtLabel}
            open={openPicker === "district"}
            onToggle={() => togglePicker("district")}
            isDark={isDark}
          >
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              <FilterButton
                active={draftDistrict === "all"}
                onClick={() => selectDistrict("all")}
                isDark={isDark}
              >
                すべて
              </FilterButton>
              {DISTRICTS.map((district) => (
                <FilterButton
                  key={district}
                  active={draftDistrict === district}
                  onClick={() => selectDistrict(district)}
                  isDark={isDark}
                >
                  {district}
                </FilterButton>
              ))}
            </div>
          </CompactPickerRow>

          <CompactPickerRow
            label="職種"
            value={jobTypeLabel}
            open={openPicker === "jobType"}
            onToggle={() => togglePicker("jobType")}
            isDark={isDark}
          >
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              <FilterButton
                active={draftJobType === "all"}
                onClick={() => selectJobType("all")}
                isDark={isDark}
              >
                すべて
              </FilterButton>
              {JOB_TYPES.map((type) => (
                <FilterButton
                  key={type}
                  active={draftJobType === type}
                  onClick={() => selectJobType(type)}
                  isDark={isDark}
                >
                  {type}
                </FilterButton>
              ))}
            </div>
          </CompactPickerRow>

          <CompactPickerRow
            label="時給"
            value={salaryLabel}
            open={openPicker === "minSalary"}
            onToggle={() => togglePicker("minSalary")}
            isDark={isDark}
          >
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {SALARY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMinSalary(option.value)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    draftMinSalary === option.value
                      ? "bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-void shadow-luxury-sm"
                      : isDark
                        ? "text-white/80 hover:bg-gold/10"
                        : "text-charcoal hover:bg-white/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CompactPickerRow>
        </div>

        <button
          type="button"
          onClick={() => handleSearch()}
          className={`mt-3 min-h-11 w-full rounded-full px-5 py-2.5 text-sm ${luxuryMetalBtn}`}
        >
          検索する
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAdvanced((current) => !current);
            setOpenPicker(null);
          }}
          aria-expanded={showAdvanced}
          className={`mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isDark
              ? "border-gold/45 bg-void/60 text-gold-mid hover:border-gold-light hover:bg-gold/10"
              : "border-gold/40 bg-ivory text-gold-dark hover:border-gold hover:bg-gold/5"
          }`}
        >
          詳しく探す
          <ChevronDown open={showAdvanced} />
        </button>

        {showAdvanced && (
          <div className={`mt-4 space-y-4 border-t pt-4 ${isDark ? "border-gold/40" : "border-gold/30"}`}>
            <div>
              <label
                htmlFor="shop-keyword"
                className={`mb-2 block text-sm font-semibold ${
                  isDark ? "text-gold-mid" : "text-charcoal"
                }`}
              >
                ワード検索
              </label>
              <input
                id="shop-keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className={`min-h-11 w-full ${isDark ? luxuryDarkInput : "rounded-2xl border border-gold/30 bg-ivory px-4 py-2.5 text-base text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"}`}
                placeholder="例：ロゼッタ、ニュークラ、送迎あり"
              />
            </div>

            <div className="space-y-3">
              <p className={`text-sm font-semibold ${isDark ? "text-white/85" : "text-charcoal"}`}>
                待遇で絞り込む
              </p>
              {BENEFIT_SEARCH_CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className={`rounded-2xl border p-3 ${
                    isDark
                      ? "border-gold/35 bg-void/60"
                      : "border-gold/15 bg-ivory/70"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gold-mid">
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
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                            selected
                              ? "border-gold bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-void shadow-luxury-sm"
                              : isDark
                                ? "border-gold/40 bg-charcoal/80 text-white/65 hover:border-gold hover:text-gold-light"
                                : "border-gold/35 bg-white text-muted hover:border-gold hover:bg-gold/5 hover:text-gold-dark"
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

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className={`min-h-11 w-full rounded-full border px-5 py-2.5 text-sm font-semibold ${
                  isDark
                    ? "border-gold/45 bg-void/60 text-gold-mid hover:bg-gold/10"
                    : "border-gold/40 bg-ivory text-gold-dark hover:bg-gold-light/20"
                }`}
              >
                条件をリセット
              </button>
              <button
                type="button"
                onClick={() => handleSearch()}
                className={`min-h-11 w-full rounded-full px-5 py-2.5 text-sm ${luxuryMetalBtn}`}
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
