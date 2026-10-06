import type { Metadata } from "next";
import { MemberGatePage } from "@/components/MemberGatePage";
import { SalesStyleDiagnosis } from "@/components/SalesStyleDiagnosis";
import { MEMBER_PATHS } from "@/lib/member-access";
import { buildPageMetadata } from "@/lib/seo";
import { getServerUserSession } from "@/lib/server-user-session";

export const metadata: Metadata = buildPageMetadata(
  "あなたに合う営業スタイル診断｜札幌の夜職",
  "12の質問で、夜職でのあなたらしい接客・営業スタイルを5タイプから診断できます。特徴・向いている接客・苦手になりやすいこと・おすすめの働き方・相性の良い職種まで確認でき、札幌の求人探しの参考にできます。LINEログイン後、結果を保存できます。",
  "/sales-style-diagnosis",
);

export default async function SalesStyleDiagnosisPage() {
  const session = await getServerUserSession();

  if (!session.authenticated) {
    return (
      <MemberGatePage
        title="営業スタイル診断はLINEログイン後に利用できます"
        description="診断結果を保存して、マイページでいつでも確認できます。"
        redirectPath={MEMBER_PATHS.salesStyleDiagnosis}
        action="diagnosis"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <SalesStyleDiagnosis authenticated />
    </div>
  );
}
