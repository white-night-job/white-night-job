import type { Metadata } from "next";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "初めての方へ｜夜職求人の探し方",
  "体入ホワイトナイトを初めてご利用の方向けガイドです。札幌の夜職求人の探し方、体験入店の進め方、当サイトの安心サポートをステップでわかりやすくご案内します。失敗しにくいお店選びの順番が分かります。いきなり応募せず、比較と確認の順番で進めるのがおすすめです。",
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
