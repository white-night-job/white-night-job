import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: `${SITE_NAME}の特定商取引法に基づく表記です。`,
};

const UPDATED_AT = "2026年6月3日";

export default function LegalPage() {
  return (
    <LegalDocument
      title="特定商取引法に基づく表記"
      description={`${SITE_NAME}における有料サービス（求人掲載プラン等）の販売に関する表示です。`}
      updatedAt={UPDATED_AT}
      sections={[
        {
          id: "seller",
          title: "販売事業者",
          content: <p>合同会社COMSIA</p>,
        },
        {
          id: "operator",
          title: "運営責任者",
          content: <p>西東時雄</p>,
        },
        {
          id: "address",
          title: "所在地",
          content: (
            <p>〒063-0811 北海道札幌市西区琴似1条5丁目4-18細川ビル3階</p>
          ),
        },
        {
          id: "phone",
          title: "電話番号",
          content: <p>011-600-1073</p>,
        },
        {
          id: "email",
          title: "メールアドレス",
          content: <p>comsia.info@gmail.com</p>,
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
