import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "掲載審査申し込み完了",
  "掲載審査のお申し込み受付完了ページ。",
  "/for-shops/apply/complete",
);

type PageProps = {
  searchParams?: Promise<{ no?: string }>;
};

export default async function ListingApplyCompletePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const applicationNumber = params.no?.trim() || "";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs tracking-[0.2em] text-gold-dark">RECEIVED</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-charcoal">
          掲載審査のお申し込みを受け付けました
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          審査結果は、ご登録いただいたメールアドレスまたは電話番号へご連絡します。
          確認には数営業日かかる場合があります。
        </p>
        {applicationNumber && (
          <p className="mt-5 rounded-xl bg-ivory px-4 py-3 text-sm text-charcoal">
            申請番号：
            <span className="ml-2 font-semibold tracking-wide">
              {applicationNumber}
            </span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/for-shops/review-status"
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-center text-sm font-semibold text-white"
          >
            審査状況を確認する
          </Link>
          <Link
            href="/for-shops"
            className="rounded-full border border-gold/40 px-5 py-3 text-center text-sm font-medium text-gold-dark"
          >
            掲載案内へ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
