import type { Metadata } from "next";
import { ConsultationPageClient } from "@/components/ConsultationPageClient";
import { MemberGatePage } from "@/components/MemberGatePage";
import { MEMBER_PATHS } from "@/lib/member-access";
import { buildPageMetadata } from "@/lib/seo";
import { getServerUserSession } from "@/lib/server-user-session";

export const metadata: Metadata = buildPageMetadata(
  "AI相談｜夜職のお悩みサポート",
  "LINEログイン後、AI相談で夜職の疑問を気軽にご相談いただけます。体験入店や職種選びなど、札幌で働き始める前の不安を整理するためのオンラインサポートです。忙しいときでも短時間で相談を始められます。相談履歴を残せるので、続きの質問もしやすいのが特長です。",
  "/consultation",
);

export default async function ConsultationPage() {
  const session = await getServerUserSession();

  if (!session.authenticated) {
    return (
      <MemberGatePage
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
        action="consultation"
      />
    );
  }

  return <ConsultationPageClient />;
}
