"use client";

import { useEffect, useState } from "react";

type StoreImagesGalleryProps = {
  images: string[];
  shopName: string;
};

export function StoreImagesGallery({ images, shopName }: StoreImagesGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? null : Math.min(current + 1, images.length - 1),
        );
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? null : Math.max(current - 1, 0),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-ivory to-white p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-charcoal">店舗ギャラリー</h2>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {images.map((imageUrl, index) => (
              <li key={`${imageUrl}-${index}`} className="w-56 shrink-0 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group block w-full overflow-hidden rounded-xl border border-gold/25 bg-white shadow-gold transition hover:border-gold/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`${shopName}の店舗ギャラリー ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-2 text-xs text-muted sm:hidden">
          横にスクロールして画像を確認できます。タップで拡大表示します。
        </p>
      </section>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="店舗ギャラリーの拡大表示"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/50 px-3 py-1.5 text-sm font-medium text-white"
          >
            閉じる
          </button>

          {images.length > 1 && activeIndex > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) =>
                  current === null ? null : Math.max(current - 1, 0),
                );
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/50 px-3 py-2 text-white sm:left-6"
              aria-label="前の画像"
            >
              ‹
            </button>
          )}

          {images.length > 1 && activeIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) =>
                  current === null
                    ? null
                    : Math.min(current + 1, images.length - 1),
                );
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/50 px-3 py-2 text-white sm:right-6"
              aria-label="次の画像"
            >
              ›
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex]}
            alt={`${shopName}の店舗ギャラリー ${activeIndex + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
