import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "掲載店舗向け利用規約",
  description: `${SITE_NAME}の掲載店舗向け利用規約です。`,
};

const UPDATED_AT = "2026年6月18日";

export default function TermsShopPage() {
  return (
    <LegalDocument
      title="掲載店舗向け利用規約"
      description={`${SITE_NAME}へ求人掲載する店舗向けの利用条件です。`}
      updatedAt={UPDATED_AT}
      sections={[
        {
          id: "listing",
          title: "1. 求人掲載について",
          content: (
            <p>
              掲載店舗は、当サイト所定の方法に従って求人情報を登録・更新し、法令を遵守した募集を行うものとします。
            </p>
          ),
        },
        {
          id: "accuracy",
          title: "2. 掲載情報の正確性",
          content: (
            <p>
              店舗名、待遇、応募条件等の掲載情報は、掲載店舗の責任で正確かつ最新の状態に保ってください。
            </p>
          ),
        },
        {
          id: "false-listing",
          title: "3. 虚偽求人禁止",
          content: (
            <p>
              虚偽、誇大、誤認を招く求人情報の掲載は禁止します。発覚時は掲載停止等の措置を行います。
            </p>
          ),
        },
        {
          id: "screening",
          title: "4. 掲載審査",
          content: (
            <p>
              当サイトは、掲載申込内容を審査し、掲載可否を判断できます。審査基準や結果の詳細開示義務は負いません。
            </p>
          ),
        },
        {
          id: "suspension",
          title: "5. 掲載停止/削除",
          content: (
            <p>
              規約違反または運営上必要と判断した場合、当サイトは事前通知なく掲載停止・削除を行えるものとします。
            </p>
          ),
        },
        {
          id: "login",
          title: "6. 店舗ログインID/PW管理",
          content: (
            <p>
              ログインID・パスワードは掲載店舗が厳重に管理してください。漏えいや不正利用による損害は掲載店舗の責任とします。
            </p>
          ),
        },
        {
          id: "price",
          title: "7. 掲載料金",
          content: (
            <p>
              掲載料金は申込時に提示されるプラン内容に従います。価格改定時は当サイト上で告知します。
            </p>
          ),
        },
        {
          id: "monthly-renewal",
          title: "8. 月額掲載/自動更新",
          content: (
            <p>
              月額プランは契約期間満了時に自動更新される場合があります。更新条件は申込プランに準じます。
            </p>
          ),
        },
        {
          id: "payment",
          title: "9. 決済方法",
          content: <p>決済は当サイトが定めるクレジットカード決済等の方法で行います。</p>,
        },
        {
          id: "cancel",
          title: "10. 解約",
          content: (
            <p>
              解約は次回更新日前までに所定手続きで申請してください。更新後期間分の途中解約は原則受け付けません。
            </p>
          ),
        },
        {
          id: "refund",
          title: "11. 返金不可",
          content: (
            <p>
              サービスの性質上、支払済み料金の返金は法令上必要な場合を除き原則行いません。
            </p>
          ),
        },
        {
          id: "boost",
          title: "12. 上位表示機能",
          content: (
            <p>
              上位表示機能の利用条件、回数制限、順位算出ロジックは当サイト仕様に従うものとし、結果を保証するものではありません。
            </p>
          ),
        },
        {
          id: "analytics",
          title: "13. 応募数/表示回数の計測",
          content: (
            <p>
              当サイトは応募数・表示回数などの統計情報を計測し、店舗ダッシュボードで表示します。計測値は参考情報であり完全性を保証しません。
            </p>
          ),
        },
        {
          id: "black-report",
          title: "14. ブラック店報告への対応",
          content: (
            <p>
              当サイトはブラック店舗報告を受けた場合、内容確認の上で掲載内容の修正依頼、掲載停止等を行う場合があります。
            </p>
          ),
        },
        {
          id: "prohibited",
          title: "15. 禁止事項",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>虚偽または違法な求人掲載</li>
              <li>他店舗・求職者への権利侵害、誹謗中傷</li>
              <li>不正な応募誘導、なりすまし行為</li>
              <li>当サイト運営を妨害する行為</li>
            </ul>
          ),
        },
        {
          id: "disclaimer",
          title: "16. 免責事項",
          content: (
            <p>
              当サイトは、掲載継続、応募数、採用成果、売上向上等を保証しません。利用に伴う損害について、故意または重過失を除き責任を負いません。
            </p>
          ),
        },
        {
          id: "changes",
          title: "17. 規約変更",
          content: (
            <p>
              当サイトは必要に応じて本規約を変更できます。変更後の規約は当サイト掲載時点で効力を生じます。
            </p>
          ),
        },
        {
          id: "law",
          title: "18. 準拠法",
          content: (
            <p>
              本規約は日本法に準拠し、本規約に関する紛争は運営者所在地を管轄する裁判所を第一審の専属的合意管轄とします。
            </p>
          ),
        },
      ]}
    />
  );
}
