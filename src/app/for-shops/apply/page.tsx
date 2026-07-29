import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListingApplicationForm } from "@/components/for-shops/ListingApplicationForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "掲載審査の申し込み",
  "White Night Jobへの掲載審査申請フォーム。店舗情報を入力して審査をお申し込みください。",
  "/for-shops/apply",
);

export default function ListingApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs tracking-[0.2em] text-gold-dark">LISTING REVIEW</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
        掲載審査を申し込む
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        掲載前に店舗情報を確認し、当サイトの掲載基準に沿って審査を行います。
        審査通過後に、プラン選択・求人情報入力・掲載開始へ進みます。
        申請だけでは求人は公開されず、料金も確定しません。
      </p>
      <p className="mt-2 text-xs text-muted">
        <Link href="/for-shops" className="text-gold-dark underline">
          掲載案内へ戻る
        </Link>
        {" · "}
        <Link href="/for-shops/review-status" className="text-gold-dark underline">
          審査状況を確認
        </Link>
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">読み込み中...</p>}>
          <ListingApplicationForm />
        </Suspense>
      </div>
    </div>
  );
}
