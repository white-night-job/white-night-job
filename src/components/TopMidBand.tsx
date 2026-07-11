"use client";

import { LineLoginPromoCard } from "@/components/LineLoginPromoCard";
import { TopFeatureIntroSection } from "@/components/TopFeatureIntroSection";

export function TopMidBand() {
  return (
    <div className="top-mid-band">
      <TopFeatureIntroSection />
      <div className="top-mid-band-line-wrap">
        <LineLoginPromoCard />
      </div>
    </div>
  );
}
