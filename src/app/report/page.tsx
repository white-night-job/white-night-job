import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { ReportForm } from "@/components/ReportForm";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "ブラック店舗報告",
  `${SITE_FORMAL_NAME}のブラック店舗報告フォームです。問題のある店舗情報をお寄せください。`,
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
