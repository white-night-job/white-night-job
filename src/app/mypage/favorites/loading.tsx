import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";

export default function MyPageFavoritesLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <h1 className="mb-4 font-serif text-2xl font-semibold text-charcoal">お気に入り</h1>
      <div className="space-y-3">
        <MyPageSectionSkeleton height="h-40" />
        <MyPageSectionSkeleton height="h-40" />
      </div>
    </div>
  );
}
