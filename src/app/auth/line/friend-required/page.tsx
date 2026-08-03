import type { Metadata } from "next";
import { FriendRequiredClient } from "@/components/FriendRequiredClient";
import {
  getLineOfficialAccountAddUrl,
  getLineOfficialAccountId,
} from "@/lib/line-friendship";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "まずはLINEを友だち追加",
  "体入ホワイトナイトのLINE公式アカウントを友だち追加すると、求人閲覧や職種診断などの会員機能をご利用いただけます。友だち追加後に、引き続きサービスをご利用ください。追加後の画面案内に従って進めてください。友だち追加後は、案内に従って会員向け機能へお進みください。",
  "/auth/line/friend-required",
  { noIndex: true },
);

export default function LineFriendRequiredPage() {
  return (
    <FriendRequiredClient
      addFriendUrl={getLineOfficialAccountAddUrl()}
      accountId={getLineOfficialAccountId()}
    />
  );
}
