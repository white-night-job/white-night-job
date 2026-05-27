import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">
        求人が見つかりません
      </h1>
      <p className="mt-2 text-muted">URLが正しいかご確認ください。</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white"
      >
        求人一覧へ戻る
      </Link>
    </div>
  );
}
