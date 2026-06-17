import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "利用規約（求職者）",
  description: `${SITE_NAME}の求職者向け利用規約です。`,
};

const UPDATED_AT = "2026年6月18日";

export default function TermsUserPage() {
  return (
    <LegalDocument
      title="利用規約（求職者）"
      description={`${SITE_NAME}を利用して求人を閲覧・応募する求職者向けの利用条件です。`}
      updatedAt={UPDATED_AT}
      sections={[
        {
          id: "site-use",
          title: "1. White Night Jobの利用について",
          content: (
            <p>
              当サイトは、夜職求人情報の閲覧および応募機会を提供する情報サービスです。求職者は本規約に同意の上、当サイトを利用するものとします。
            </p>
          ),
        },
        {
          id: "browsing",
          title: "2. 求人情報の閲覧",
          content: (
            <p>
              求職者は、当サイトに掲載された求人情報を自己責任で閲覧し、勤務条件等を確認するものとします。
            </p>
          ),
        },
        {
          id: "apply",
          title: "3. 求人への応募",
          content: (
            <p>
              応募は各求人ページの案内に従い、掲載店舗へ直接行ってください。応募の可否や採用条件は掲載店舗が判断します。
            </p>
          ),
        },
        {
          id: "line-phone",
          title: "4. LINE/電話での相談・応募",
          content: (
            <p>
              LINE、電話等の外部手段で行う相談・応募は、求職者と掲載店舗との直接連絡です。通信費等は求職者負担となります。
            </p>
          ),
        },
        {
          id: "black-report",
          title: "5. ブラック店報告",
          content: (
            <p>
              求職者は、実体験に基づく正確な情報のみ報告してください。虚偽または誹謗中傷を目的とした報告は禁止します。
            </p>
          ),
        },
        {
          id: "after-apply",
          title: "6. 応募後の店舗とのやり取り",
          content: (
            <p>
              面接日程調整、条件確認、採用可否等のやり取りは、求職者と店舗の責任で行ってください。
            </p>
          ),
        },
        {
          id: "non-party",
          title: "7. 雇用契約の当事者ではないこと",
          content: (
            <p>
              当サイトは雇用契約の当事者ではなく、求人掲載および応募導線の提供のみを行います。
            </p>
          ),
        },
        {
          id: "accuracy",
          title: "8. 求人情報の正確性",
          content: (
            <p>
              当サイトは掲載情報の正確性・完全性・最新性を保証しません。最終的な条件確認は応募先店舗へ直接行ってください。
            </p>
          ),
        },
        {
          id: "prohibited",
          title: "9. 禁止事項",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>法令または公序良俗に反する行為</li>
              <li>虚偽情報の投稿、なりすまし行為</li>
              <li>当サイトまたは第三者への迷惑行為・権利侵害</li>
              <li>不正アクセス、スクレイピング等の運営妨害行為</li>
            </ul>
          ),
        },
        {
          id: "disclaimer",
          title: "10. 免責事項",
          content: (
            <p>
              当サイト利用により生じた損害について、当サイトの故意または重過失がある場合を除き、当サイトは責任を負いません。
            </p>
          ),
        },
        {
          id: "changes",
          title: "11. 規約変更",
          content: (
            <p>
              当サイトは必要に応じて本規約を変更できます。変更後の規約は当サイト掲載時点で効力を生じます。
            </p>
          ),
        },
        {
          id: "law",
          title: "12. 準拠法",
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
