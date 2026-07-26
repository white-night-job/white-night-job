import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";

export default function MyPageHistoryLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <h1 className="mb-4 font-serif text-2xl font-semibold text-charcoal">最近見た店舗</h1>
      <div className="space-y-3">
        <MyPageSectionSkeleton height="h-28" />
        <MyPageSectionSkeleton height="h-28" />
      </div>
    </div>
  );
}
