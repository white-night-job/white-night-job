"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AREAS } from "@/data/areas";

export function AreaSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentArea = searchParams.get("area") ?? "all";

  function handleAreaChange(area: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (area === "all") {
      params.delete("area");
    } else {
      params.set("area", area);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-charcoal sm:text-base">
        エリアで探す
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAreaChange("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            currentArea === "all"
              ? "bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
              : "border border-gold/30 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
          }`}
        >
          すべて
        </button>
        {AREAS.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => handleAreaChange(area)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              currentArea === area
                ? "bg-gradient-to-r from-gold to-gold-dark text-white shadow-md"
                : "border border-gold/30 bg-ivory text-muted hover:border-gold hover:text-gold-dark"
            }`}
          >
            {area}
          </button>
        ))}
      </div>
    </section>
  );
}
