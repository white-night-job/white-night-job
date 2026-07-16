import type { Metadata } from "next";
import { MemberGatePage } from "@/components/MemberGatePage";
import { NightJobDiagnosis } from "@/components/NightJobDiagnosis";
import { MEMBER_PATHS } from "@/lib/member-access";
import { getServerUserSession } from "@/lib/server-user-session";

export const metadata: Metadata = {
  title: "あなたに合う職種診断 | White Night Job",
  description: "LINEログイン後、11の質問であなたに向いている夜職の職種を診断できます。",
};

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
