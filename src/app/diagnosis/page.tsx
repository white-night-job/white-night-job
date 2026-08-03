import type { Metadata } from "next";
import { MemberGatePage } from "@/components/MemberGatePage";
import { NightJobDiagnosis } from "@/components/NightJobDiagnosis";
import { MEMBER_PATHS } from "@/lib/member-access";
import { buildPageMetadata } from "@/lib/seo";
import { getServerUserSession } from "@/lib/server-user-session";

export const metadata: Metadata = buildPageMetadata(
  "あなたに合う職種診断｜札幌の夜職",
  "11の質問であなたに向いている夜職の職種を診断できます。LINEログイン後、結果を保存しながらガールズバー・コンカフェなど札幌の働き方を比較検討できるサポート機能です。初めての職種選びにもご活用ください。診断結果は保存でき、あとから求人探しの参考にもできます。",
  "/diagnosis",
);

export default async function DiagnosisPage() {
  const session = await getServerUserSession();

  if (!session.authenticated) {
    return (
      <MemberGatePage
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
        action="diagnosis"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <NightJobDiagnosis authenticated />
    </div>
  );
}
