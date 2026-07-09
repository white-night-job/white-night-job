import type { Metadata } from "next";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "初めての方へ",
  `${SITE_FORMAL_NAME}を初めてご利用の方へ。夜職求人の探し方と当サイトの安心サポートをご案内します。`,
  "/first-time-guide",
);

export default function FirstTimeGuidePage() {
  return (
    <InfoPageLayout
      title="初めての方へ"
      description={`${SITE_LEGAL_INTRO}夜職求人を初めて探す方に向けて、不安の解消とお店選びのポイントをご案内します。`}
      pathname="/first-time-guide"
      breadcrumbLabel="初めての方へ"
    >
      <FirstTimeGuide embedded />
    </InfoPageLayout>
  );
}
