import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { SHOP_TERMS_VERSION } from "@/lib/shop-terms";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "掲載店舗向け利用規約",
  `${SITE_FORMAL_NAME}の掲載店舗向け利用規約です。求人掲載・料金・店舗管理機能に関する条件を定めています。`,
  "/terms-shop",
);

const UPDATED_AT = "2026年7月31日";

export default function TermsShopPage() {
  return (
    <LegalDocument
      title="掲載店舗向け利用規約"
      description={`${SITE_LEGAL_INTRO}本規約は、${SITE_FORMAL_NAME}へ求人掲載する店舗向けの利用条件です。`}
      updatedAt={UPDATED_AT}
      pathname="/terms-shop"
      breadcrumbLabel="掲載店舗向け利用規約"
      showBackToApply
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
          id: "antisocial",
          title: "16. 反社会的勢力の排除",
          content: (
            <div className="space-y-4">
              <p>
                1.
                掲載店舗は、現在および将来にわたり、自ら、その代表者、役員、実質的経営者、従業員、代理人その他関係者が、次の各号のいずれにも該当しないことを表明し、保証するものとします。
              </p>
              <ol className="list-decimal space-y-1 pl-6">
                <li>暴力団</li>
                <li>暴力団員</li>
                <li>暴力団員でなくなった時から5年を経過しない者</li>
                <li>暴力団準構成員</li>
                <li>暴力団関係企業</li>
                <li>
                  総会屋、社会運動等標ぼうゴロ、特殊知能暴力集団その他これらに準ずる者
                </li>
                <li>前各号に該当する者と密接な関係を有する者</li>
              </ol>
              <p>
                2.
                掲載店舗は、次の各号に該当する関係を有しないことを表明し、保証するものとします。
              </p>
              <ol className="list-decimal space-y-1 pl-6">
                <li>反社会的勢力が経営を支配している関係</li>
                <li>反社会的勢力が経営に実質的に関与している関係</li>
                <li>反社会的勢力を利用している関係</li>
                <li>反社会的勢力に資金、利益または便宜を提供している関係</li>
                <li>反社会的勢力と社会的に非難されるべき関係</li>
              </ol>
              <p>
                3.
                掲載店舗は、自らまたは第三者を利用して、次の行為を行ってはなりません。
              </p>
              <ol className="list-decimal space-y-1 pl-6">
                <li>暴力的な要求行為</li>
                <li>法的な責任を超えた不当な要求行為</li>
                <li>脅迫的な言動または暴力を用いる行為</li>
                <li>
                  風説の流布、偽計または威力を用いて当サイトの信用を毀損し、または業務を妨害する行為
                </li>
                <li>その他前各号に準ずる行為</li>
              </ol>
              <p>
                4.
                当サイトは、掲載店舗が前各項のいずれかに違反している、または違反している疑いがあると合理的に判断した場合、事前の通知または催告を行うことなく、掲載の拒否、停止、削除、利用契約の解除その他必要な措置を講じることができます。
              </p>
              <p>
                5.
                当サイトは、前項の措置により掲載店舗に損害が生じても、一切の責任を負いません。
              </p>
              <p>
                6.
                掲載店舗は、本条への違反により当サイトまたは第三者に損害を与えた場合、その損害を賠償するものとします。
              </p>
              <p className="text-xs text-muted">
                規約バージョン: {SHOP_TERMS_VERSION}
              </p>
            </div>
          ),
        },
        {
          id: "disclaimer",
          title: "17. 免責事項",
          content: (
            <p>
              当サイトは、掲載継続、応募数、採用成果、売上向上等を保証しません。利用に伴う損害について、故意または重過失を除き責任を負いません。
            </p>
          ),
        },
        {
          id: "changes",
          title: "18. 規約変更",
          content: (
            <p>
              当サイトは必要に応じて本規約を変更できます。変更後の規約は当サイト掲載時点で効力を生じます。
            </p>
          ),
        },
        {
          id: "law",
          title: "19. 準拠法",
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
