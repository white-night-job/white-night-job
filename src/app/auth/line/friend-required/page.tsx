import type { Metadata } from "next";
import { FriendRequiredClient } from "@/components/FriendRequiredClient";
import {
  getLineOfficialAccountAddUrl,
  getLineOfficialAccountId,
} from "@/lib/line-friendship";

export const metadata: Metadata = {
  title: "友だち追加が必要です | 体入ホワイトナイト",
  robots: { index: false, follow: false },
};

export default function LineFriendRequiredPage() {
  return (
    <FriendRequiredClient
      addFriendUrl={getLineOfficialAccountAddUrl()}
      accountId={getLineOfficialAccountId()}
    />
  );
}
