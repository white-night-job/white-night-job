"use client";

import { LineLoginPromoCard } from "@/components/LineLoginPromoCard";
import { TopFeatureIntroSection } from "@/components/TopFeatureIntroSection";
import { TopSearchFollowCtas } from "@/components/TopSearchFollowCtas";

export function TopMidBand() {
  return (
    <div className="top-mid-band">
      <TopSearchFollowCtas />
      <TopFeatureIntroSection />
      <div className="top-mid-band-line-wrap">
        <LineLoginPromoCard />
      </div>
    </div>
  );
}
