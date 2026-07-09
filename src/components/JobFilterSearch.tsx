"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { BENEFIT_SEARCH_CATEGORIES } from "@/data/benefits";
import { DISTRICTS } from "@/data/districts";
import {
  isPremiumTheme,
  luxuryCardSurface,
  luxuryMetalBtn,
  luxuryPremiumInput,
  luxuryPremiumPanel,
  luxurySectionHeading,
  sectionHeading,
  type LuxuryTheme,
} from "@/lib/luxury-styles";
import { saveSearchHistory } from "@/lib/search-history";
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
  isPremium = false,
  reservation = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isPremium?: boolean;
  reservation?: boolean;
}) {
  if (reservation) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`reservation-option-btn rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          active ? "is-active" : ""
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-charcoal shadow-luxury-sm"
          : isPremium
            ? "border border-gold/45 bg-white/80 text-muted hover:border-gold hover:text-gold-dark"
            : "border border-gold/35 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronDown({
  open,
  reservation = false,
}: {
  open: boolean;
  reservation?: boolean;
}) {
  return (
    <svg
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
        reservation ? "reservation-chevron h-3.5 w-3.5" : "h-4 w-4 text-gold"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={reservation ? 1.5 : 2}
        d="M6 9l6 6 6-6"
      />
    </svg>
  );
}

function PickerIcon({
  kind,
}: {
  kind: "district" | "jobType" | "minSalary";
}) {
  const paths = {
    district: (
      <>
        <path
          d="M12 21s-5.5-4.35-5.5-9a5.5 5.5 0 1111 0c0 4.65-5.5 9-5.5 9z"
          strokeWidth="1.4"
        />
        <circle cx="12" cy="12" r="1.75" strokeWidth="1.4" />
      </>
    ),
    jobType: (
      <>
        <path
          d="M8 4h8l-1.2 8.2a3.8 3.8 0 01-7.6 0L8 4z"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M12 12.5V18M9.5 20.5h5" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    minSalary: (
      <>
        <circle cx="12" cy="12" r="7.25" strokeWidth="1.4" />
        <path
          d="M9.2 9.2h4.2c1.1 0 2 .7 2 1.7s-.9 1.7-2 1.7H9.2M9.2 12.6h4.6c1.1 0 2 .7 2 1.7s-.9 1.7-2 1.7H9.2M11 7.5v1.7M11 16.3v1.7"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  };

  return (
    <svg
      className="reservation-picker-icon h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      {paths[kind]}
    </svg>
  );
}

function CompactPickerRow({
  label,
  value,
  open,
  onToggle,
  children,
  isPremium = false,
  reservation = false,
  iconKind,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isPremium?: boolean;
  reservation?: boolean;
  iconKind?: "district" | "jobType" | "minSalary";
}) {
  if (reservation) {
    return (
      <div className={`reservation-picker-row ${open ? "is-open" : ""}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="reservation-picker-btn"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {iconKind && <PickerIcon kind={iconKind} />}
            <span className="reservation-picker-label">{label}</span>
          </span>
          <span className="flex min-w-0 items-center justify-end gap-2">
            <span className="reservation-picker-value truncate">{value}</span>
            <ChevronDown open={open} reservation />
          </span>
        </button>
        {open && (
          <div className="reservation-picker-panel">{children}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`border-b last:border-b-0 ${isPremium ? "border-gold/30" : "border-gold/15"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-1 py-2.5 text-left"
      >
        <span
          className={`w-14 shrink-0 text-sm font-medium sm:w-16 ${
            isPremium ? "text-gold-dark" : "text-muted"
          }`}
        >
          {label}
        </span>
        <span
          className={`flex min-w-0 flex-1 items-center justify-end gap-1.5 text-sm font-semibold ${
            isPremium ? "text-charcoal" : "text-charcoal"
          }`}
        >
          <span className="truncate">{value}</span>
          <ChevronDown open={open} />
        </span>
      </button>
      {open && (
        <div
          className={`mb-2 rounded-xl border p-2 shadow-inner ${
            isPremium
              ? "border-gold/40 bg-white/90"
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
  embedded?: boolean;
  inPlate?: boolean;
};

export function JobFilterSearch({
  appliedFilters,
  onApply,
  resultsPath,
  theme = "light",
  embedded = false,
  inPlate = false,
}: JobFilterSearchProps) {
  const isPremium = isPremiumTheme(theme);
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
    saveSearchHistory(nextFilters);
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

  const searchBody = (
    <>
      <div className={`relative ${inPlate ? "hero-search-title mb-3 text-center" : "mb-3"}`}>
        {!inPlate && (
          <p
            className={`mb-0.5 text-xs font-semibold tracking-[0.2em] ${
              embedded ? "text-[#e8e0cc]" : "text-gold-dark"
            }`}
          >
            SHOP SEARCH
          </p>
        )}
        <h2
          className={
            inPlate
              ? "hero-search-heading font-serif"
              : embedded
                ? "font-serif text-lg font-semibold text-white sm:text-xl"
                : isPremium
                  ? sectionHeading(theme)
                  : luxurySectionHeading
          }
        >
          お店を探す
        </h2>
        {inPlate && (
          <p className="hero-search-sub mt-1">条件を選んで検索</p>
        )}
      </div>

      <div
        ref={pickerRef}
        className={`relative ${
          inPlate
            ? "hero-reservation-fields"
            : `rounded-lg px-3 py-1 ${
                isPremium || embedded
                  ? "rounded-xl border border-gold/50 bg-white/80 shadow-luxury-sm"
                  : "border border-gold/25 bg-ivory/80"
              }`
        }`}
      >
          <CompactPickerRow
            label="エリア"
            value={districtLabel}
            open={openPicker === "district"}
            onToggle={() => togglePicker("district")}
            isPremium={isPremium || embedded || inPlate}
            reservation={inPlate}
            iconKind="district"
          >
            <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
              <FilterButton
                active={draftDistrict === "all"}
                onClick={() => selectDistrict("all")}
                isPremium={isPremium || embedded || inPlate}
                reservation={inPlate}
              >
                すべて
              </FilterButton>
              {DISTRICTS.map((district) => (
                <FilterButton
                  key={district}
                  active={draftDistrict === district}
                  onClick={() => selectDistrict(district)}
                  isPremium={isPremium || embedded || inPlate}
                  reservation={inPlate}
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
            isPremium={isPremium || embedded || inPlate}
            reservation={inPlate}
            iconKind="jobType"
          >
            <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
              <FilterButton
                active={draftJobType === "all"}
                onClick={() => selectJobType("all")}
                isPremium={isPremium || embedded || inPlate}
                reservation={inPlate}
              >
                すべて
              </FilterButton>
              {JOB_TYPES.map((type) => (
                <FilterButton
                  key={type}
                  active={draftJobType === type}
                  onClick={() => selectJobType(type)}
                  isPremium={isPremium || embedded || inPlate}
                  reservation={inPlate}
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
            isPremium={isPremium || embedded || inPlate}
            reservation={inPlate}
            iconKind="minSalary"
          >
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {SALARY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectMinSalary(option.value)}
                  className={
                    inPlate
                      ? `reservation-option-btn w-full rounded-md px-3 py-2 text-left text-xs font-medium ${
                          draftMinSalary === option.value ? "is-active" : ""
                        }`
                      : `rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          draftMinSalary === option.value
                            ? "bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-charcoal shadow-luxury-sm"
                            : "text-charcoal hover:bg-champagne/40"
                        }`
                  }
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
          className={
            inPlate
              ? "hero-search-submit"
              : `relative mt-3 min-h-11 w-full rounded-full px-5 py-2.5 text-sm ${luxuryMetalBtn}`
          }
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
          className={
            inPlate
              ? "hero-search-advanced"
              : `mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  embedded
                    ? "border-[#c4b896]/50 bg-black/25 text-[#e8e0cc] hover:border-[#d4c9a8] hover:bg-black/35"
                    : isPremium
                      ? "border-gold/50 bg-white/70 text-gold-dark hover:border-gold hover:bg-champagne/30"
                      : "border-gold/40 bg-ivory text-gold-dark hover:border-gold hover:bg-gold/5"
                }`
          }
        >
          詳しく探す
          <ChevronDown open={showAdvanced} reservation={inPlate} />
        </button>

        {showAdvanced && (
          <div
            className={`relative ${
              inPlate
                ? "hero-search-advanced-panel"
                : `mt-3 space-y-3 border-t pt-3 ${
                    isPremium ? "border-gold/40" : "border-gold/30"
                  }`
            }`}
          >
            <div>
              <label
                htmlFor="shop-keyword"
                className={`mb-2 block font-medium ${
                  inPlate
                    ? "hero-search-field-label"
                    : "text-sm font-semibold text-charcoal"
                }`}
              >
                ワード検索
              </label>
              <input
                id="shop-keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className={
                  inPlate
                    ? "hero-search-input"
                    : `min-h-11 w-full ${isPremium ? luxuryPremiumInput : "rounded-2xl border border-gold/30 bg-ivory px-4 py-2.5 text-base text-charcoal outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"}`
                }
                placeholder="例：ロゼッタ、ニュークラ、送迎あり"
              />
            </div>

            <div className="space-y-3">
              <p
                className={`font-medium ${
                  inPlate
                    ? "hero-search-field-label"
                    : "text-sm font-semibold text-charcoal"
                }`}
              >
                待遇で絞り込む
              </p>
              {BENEFIT_SEARCH_CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className={`rounded-md border p-3 ${
                    inPlate
                      ? "border-[#c4a574]/30 bg-white/90"
                      : isPremium
                        ? "border-gold/35 bg-white/80"
                        : "border-gold/15 bg-ivory/70"
                  }`}
                >
                  <p
                    className={`mb-2 font-medium ${
                      inPlate
                        ? "text-[10px] tracking-[0.1em] text-[#c4a574]"
                        : "text-xs font-semibold tracking-wide text-gold-dark"
                    }`}
                  >
                    {category.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {category.items.map((benefit) => {
                      const selected = draftBenefits.includes(benefit);
                      return (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() => toggleBenefit(benefit)}
                          className={
                            inPlate
                              ? `reservation-option-btn rounded-md px-2.5 py-1.5 text-xs font-medium ${
                                  selected ? "is-active" : ""
                                }`
                              : `rounded-full border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                                  selected
                                    ? "border-gold bg-gradient-to-r from-gold-dark via-gold to-gold-mid text-charcoal shadow-luxury-sm"
                                    : isPremium
                                      ? "border-gold/40 bg-white text-muted hover:border-gold hover:bg-champagne/30 hover:text-gold-dark"
                                      : "border-gold/35 bg-white text-muted hover:border-gold hover:bg-gold/5 hover:text-gold-dark"
                                }`
                          }
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
                className={
                  inPlate
                    ? "hero-search-reset"
                    : `min-h-11 w-full rounded-full border px-5 py-2.5 text-sm font-semibold ${
                        isPremium
                          ? "border-gold/50 bg-white/70 text-gold-dark hover:bg-champagne/30"
                          : "border-gold/40 bg-ivory text-gold-dark hover:bg-gold-light/20"
                      }`
                }
              >
                条件をリセット
              </button>
              <button
                type="button"
                onClick={() => handleSearch()}
                className={
                  inPlate
                    ? "hero-search-submit"
                    : `min-h-11 w-full rounded-full px-5 py-2.5 text-sm ${luxuryMetalBtn}`
                }
              >
                検索する
              </button>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) {
    return (
      <div
        id="shop-search"
        className={`relative scroll-mt-24 sm:scroll-mt-28 ${inPlate ? "hero-reservation-form" : ""}`}
      >
        {searchBody}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section
        id="shop-search"
        className={`relative scroll-mt-24 overflow-hidden rounded-3xl p-4 sm:scroll-mt-28 sm:p-5 ${
          isPremium ? luxuryPremiumPanel : luxuryCardSurface
        }`}
      >
        {isPremium && (
          <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-45" aria-hidden />
        )}
        <div className="relative">{searchBody}</div>
      </section>
    </div>
  );
}
