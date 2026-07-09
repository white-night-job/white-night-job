import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "プライバシーポリシー",
  `${SITE_FORMAL_NAME}のプライバシーポリシーです。個人情報の取得・利用・管理について定めています。`,
  "/privacy",
);

const UPDATED_AT = "2026年6月3日";

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="プライバシーポリシー"
      description={`${SITE_LEGAL_INTRO}利用者の個人情報および関連情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。`}
      updatedAt={UPDATED_AT}
      pathname="/privacy"
      breadcrumbLabel="プライバシーポリシー"
      sections={[
        {
          id: "operator",
          title: "1. 運営者",
          content: (
            <p>
              本ポリシーに基づく個人情報の取り扱いは、{SITE_FORMAL_NAME}
              の運営者（以下「当社」）が行います。
            </p>
          ),
        },
        {
          id: "collected",
          title: "2. 取得する情報",
          content: (
            <>
              <p>当サイトでは、以下の情報を取得する場合があります。</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  ブラック店舗報告フォームに入力された店舗名・エリア・報告種別・詳細内容・連絡先（任意）
                </li>
                <li>LINEログインに伴うプロフィール情報（表示名・画像等）</li>
                <li>店舗ログインに使用するログインID・認証情報</li>
                <li>
                  求人閲覧・応募操作に伴うアクセスログ（表示回数、応募種別、日時等）
                </li>
                <li>画像アップロード時のファイル情報および保存先URL</li>
                <li>
                  Cookie・セッション情報（ユーザー・店舗・管理者ログインの認証状態維持）
                </li>
                <li>お問い合わせ・報告に関する通信内容</li>
              </ul>
            </>
          ),
        },
        {
          id: "purpose",
          title: "3. 利用目的",
          content: (
            <>
              <p>取得した情報は、以下の目的で利用します。</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>求人情報の掲載・表示・管理</li>
                <li>お気に入り・閲覧履歴等のユーザー機能の提供</li>
                <li>店舗ダッシュボードおよび管理者機能の提供</li>
                <li>応募数・表示回数等の統計・分析</li>
                <li>ブラック店舗報告の受付・確認・対応</li>
                <li>不正利用の防止およびセキュリティの確保</li>
                <li>サービスの改善・新機能の開発</li>
                <li>お問い合わせ・報告への対応</li>
              </ul>
            </>
          ),
        },
        {
          id: "cookies",
          title: "4. Cookie・セッションについて",
          content: (
            <>
              <p>
                当サイトは、ログイン状態の維持のため、httpOnly Cookieを使用します。
              </p>
              <p>
                ブラウザの設定によりCookieを無効にした場合、ログイン機能等の一部が利用できなくなることがあります。
              </p>
            </>
          ),
        },
        {
          id: "third-party",
          title: "5. 外部サービスの利用",
          content: (
            <>
              <p>
                当サイトは、データの保存・画像のホスティング等のために、Supabase等の外部サービスを利用しています。
              </p>
              <p>
                応募時に利用されるLINE・電話・SNS等の外部サービスについては、各サービスのプライバシーポリシーが適用されます。当サイトは、これら外部サービス上で行われる通信内容を直接管理しません。
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "6. 保管期間",
          content: (
            <>
              <p>
                取得した情報は、利用目的の達成に必要な期間保管します。報告内容・求人データ・統計情報等は、サービス運営上必要な期間にわたり保管される場合があります。
              </p>
              <p>
                法令により保管が義務付けられている場合は、当該期間に従います。
              </p>
            </>
          ),
        },
        {
          id: "disclosure",
          title: "7. 第三者提供",
          content: (
            <>
              <p>
                当社は、以下の場合を除き、取得した個人情報を第三者に提供しません。
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>本人の同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>
                  人の生命・身体・財産の保護のために必要で、本人の同意を得ることが困難な場合
                </li>
                <li>
                  サービス提供に必要な範囲で、業務委託先に預託する場合（適切な管理の下）
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "security",
          title: "8. 安全管理",
          content: (
            <p>
              当社は、個人情報の漏えい・滅失・毀損の防止のため、アクセス制限・認証・通信の暗号化（HTTPS）等、合理的な安全管理措置を講じます。
            </p>
          ),
        },
        {
          id: "rights",
          title: "9. 開示・訂正・削除等",
          content: (
            <p>
              本人から、個人情報の開示・訂正・利用停止・削除等の請求があった場合、法令に従い、適切に対応します。お問い合わせは、お問い合わせページまたはブラック店舗報告フォーム等を通じてご連絡ください。
            </p>
          ),
        },
        {
          id: "changes",
          title: "10. 本ポリシーの変更",
          content: (
            <>
              <p>
                当社は、法令の改正やサービス内容の変更等に応じて、本ポリシーを改定することがあります。
              </p>
              <p>
                改定後のポリシーは、当サイト上に掲載した時点で効力を生じます。
              </p>
            </>
          ),
        },
        {
          id: "contact",
          title: "11. お問い合わせ",
          content: (
            <p>
              本ポリシーに関するお問い合わせは、当サイトのお問い合わせページ、ブラック店舗報告フォーム、または管理者が指定する連絡先よりご連絡ください。
            </p>
          ),
        },
      ]}
    />
  );
}
