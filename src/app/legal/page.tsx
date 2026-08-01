import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import {
  BUSINESS_ADDRESS_DISPLAY,
  BUSINESS_EMAIL,
  BUSINESS_HOURS_DISPLAY,
  BUSINESS_LEGAL_NAME,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_REPRESENTATIVE,
} from "@/lib/business";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "特定商取引法に基づく表記",
  `${SITE_FORMAL_NAME}の特定商取引法に基づく表記です。`,
  "/legal",
);

const UPDATED_AT = "2026年8月1日";

export default function LegalPage() {
  return (
    <LegalDocument
      title="特定商取引法に基づく表記"
      description={`${SITE_LEGAL_INTRO}有料サービス（求人掲載プラン等）の販売に関する表示です。`}
      updatedAt={UPDATED_AT}
      pathname="/legal"
      breadcrumbLabel="特定商取引法に基づく表記"
      sections={[
        {
          id: "service-name",
          title: "サービス名称",
          content: <p>{SITE_FORMAL_NAME}</p>,
        },
        {
          id: "seller",
          title: "販売事業者",
          content: <p>{BUSINESS_LEGAL_NAME}</p>,
        },
        {
          id: "operator",
          title: "運営責任者",
          content: <p>{BUSINESS_REPRESENTATIVE}</p>,
        },
        {
          id: "address",
          title: "所在地",
          content: <p>{BUSINESS_ADDRESS_DISPLAY}</p>,
        },
        {
          id: "phone",
          title: "電話番号",
          content: <p>{BUSINESS_PHONE_DISPLAY}</p>,
        },
        {
          id: "email",
          title: "メールアドレス",
          content: <p>{BUSINESS_EMAIL}</p>,
        },
        {
          id: "hours",
          title: "受付時間",
          content: <p>{BUSINESS_HOURS_DISPLAY}</p>,
        },
        {
          id: "price",
          title: "販売価格",
          content: <p>掲載プランごとに表示</p>,
        },
        {
          id: "additional-fees",
          title: "商品代金以外の必要料金",
          content: <p>インターネット接続料金等は利用者負担</p>,
        },
        {
          id: "payment-method",
          title: "支払方法",
          content: <p>クレジットカード決済</p>,
        },
        {
          id: "payment-timing",
          title: "支払時期",
          content: <p>申込時</p>,
        },
        {
          id: "delivery",
          title: "サービス提供時期",
          content: <p>決済完了後</p>,
        },
        {
          id: "contract-period",
          title: "契約期間",
          content: <p>契約プランに準ずる</p>,
        },
        {
          id: "cancellation",
          title: "解約について",
          content: <p>契約更新前までに申請</p>,
        },
        {
          id: "refund",
          title: "返金について",
          content: <p>サービスの性質上、原則返金不可</p>,
        },
        {
          id: "environment",
          title: "動作環境",
          content: <p>一般的なブラウザ環境</p>,
        },
      ]}
    />
  );
}
