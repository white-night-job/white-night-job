import type { Metadata } from "next";
import Link from "next/link";
import { ListingReviewStatusForm } from "@/components/for-shops/ListingReviewStatusForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "掲載審査状況の確認",
  "体入ホワイトナイトの掲載審査状況確認ページです。申請番号とメールアドレスを入力すると、申し込み済みの掲載審査がどの段階にあるかをいつでも確認できます。審査中の進捗確認や、追加のご連絡前の確認にご利用ください。申請内容の再確認や、審査待ちの状況把握に便利です。",
  "/for-shops/review-status",
);

export default function ListingReviewStatusPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs tracking-[0.2em] text-gold-dark">STATUS</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-charcoal">
        掲載審査状況の確認
      </h1>
      <p className="mt-3 text-sm text-muted">
        申請番号と、申請時に登録したメールアドレスで現在の審査状況を確認できます。
        内部審査メモは表示されません。
      </p>
      <p className="mt-2 text-xs text-muted">
        <Link href="/for-shops/apply" className="text-gold-dark underline">
          新規に掲載審査を申し込む
        </Link>
      </p>
      <div className="mt-8">
        <ListingReviewStatusForm />
      </div>
    </div>
  );
}
