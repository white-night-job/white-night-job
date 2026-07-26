export function MyPageSectionSkeleton({ height = "h-24" }: { height?: string }) {
  return (
    <div
      className={`${height} animate-pulse rounded-2xl border border-gold/15 bg-white`}
      aria-hidden
    />
  );
}

export function MyPageProfileSkeleton() {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="h-14 w-14 animate-pulse rounded-full border-2 border-gold/25 bg-ivory" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-ivory" />
        <div className="h-4 w-24 animate-pulse rounded bg-ivory" />
      </div>
    </div>
  );
}

/** Static frame shown while the route payload is still loading. */
export function MyPageShellSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <section className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">マイページ</h1>
        <MyPageProfileSkeleton />
      </section>
      <div className="mt-5 space-y-5">
        <MyPageSectionSkeleton height="h-40" />
        <MyPageSectionSkeleton height="h-32" />
        <MyPageSectionSkeleton height="h-32" />
        <MyPageSectionSkeleton height="h-28" />
      </div>
    </div>
  );
}
