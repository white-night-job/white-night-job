import type { Metadata } from "next";
import { ConsultationPageClient } from "@/components/ConsultationPageClient";
import { MemberGatePage } from "@/components/MemberGatePage";
import { MEMBER_PATHS } from "@/lib/member-access";
import { getServerUserSession } from "@/lib/server-user-session";

export const metadata: Metadata = {
  title: "AI相談 | White Night Job",
  description: "LINEログイン後、AI相談で夜職の疑問を気軽にご相談いただけます。",
};

export default async function ConsultationPage() {
  const session = await getServerUserSession();

  if (!session.authenticated) {
    return (
      <MemberGatePage
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
      />
    );
  }

  return <ConsultationPageClient />;
}
