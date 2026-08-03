import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { ReportForm } from "@/components/ReportForm";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "ブラック店舗報告フォーム",
  "体入ホワイトナイトのブラック店舗報告フォームです。求人内容との相違や不安を感じた店舗情報をお寄せください。内容を確認のうえ、掲載見直しなどサイトの安心運営に活用いたします。安心して求人を選べる環境づくりにご協力ください。いただいた情報は慎重に取り扱い、掲載品質の改善に役立てます。",
  "/report",
);

export default function ReportPage() {
  return (
    <InfoPageLayout
      title="ブラック店舗報告"
      description={`${SITE_LEGAL_INTRO}未払い・パワハラ・違法営業など、問題のある店舗情報をお寄せください。報告内容は運営が確認し、必要に応じて掲載見直し等を行います。`}
      pathname="/report"
      breadcrumbLabel="ブラック店舗報告"
    >
      <ReportForm />
    </InfoPageLayout>
  );
}
