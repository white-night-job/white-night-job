"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StoreImagesGalleryProps = {
  images: string[];
  shopName: string;
};

export function StoreImagesGallery({ images, shopName }: StoreImagesGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? null : Math.min(current + 1, images.length - 1),
        );
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null ? null : Math.max(current - 1, 0),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, images.length]);

  if (images.length === 0) return null;

  function syncSlideFromScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const next = Math.round(el.scrollLeft / width);
    setSlideIndex(Math.min(Math.max(next, 0), images.length - 1));
  }

  function goToSlide(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.min(Math.max(index, 0), images.length - 1);
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setSlideIndex(next);
  }

  return (
    <>
      <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-white to-ivory p-3 shadow-[0_8px_28px_rgba(201,169,98,0.12)] sm:p-4">
        <h2 className="mb-2.5 flex items-center gap-2 font-serif text-xl font-semibold text-charcoal sm:mb-3">
          <span className="text-gold-dark">◆</span>
          店舗ギャラリー
        </h2>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={syncSlideFromScroll}
        >
          {images.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-${index}`}
              className="w-full shrink-0 snap-center px-0.5"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group block w-full overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold transition hover:border-gold/50"
                aria-label={`${shopName}の店舗ギャラリー ${index + 1}を拡大表示`}
              >
                <span className="relative block aspect-[4/3] w-full bg-zinc-100 sm:aspect-[16/10]">
                  <Image
                    src={imageUrl}
                    alt={`${shopName}の店舗ギャラリー ${index + 1}`}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 720px"
                    className="object-cover transition group-hover:scale-[1.01]"
                  />
                </span>
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div
            className="mt-2.5 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="店舗ギャラリーのページ"
          >
            {images.map((_, index) => {
              const active = index === slideIndex;
              return (
                <button
                  key={`dot-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${index + 1}枚目`}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition ${
                    active
                      ? "w-4 bg-gold-dark"
                      : "w-2 bg-gold/35 hover:bg-gold/55"
                  }`}
                />
              );
            })}
          </div>
        ) : null}
      </section>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="店舗ギャラリーの拡大表示"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/50 px-3 py-1.5 text-sm font-medium text-white"
          >
            閉じる
          </button>

          {images.length > 1 && lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((current) =>
                  current === null ? null : Math.max(current - 1, 0),
                );
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/50 px-3 py-2 text-white sm:left-6"
              aria-label="前の画像"
            >
              ‹
            </button>
          )}

          {images.length > 1 && lightboxIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((current) =>
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

          <div
            className="relative h-[min(85vh,900px)] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]!}
              alt={`${shopName}の店舗ギャラリー ${lightboxIndex + 1}`}
              fill
              sizes="90vw"
              className="rounded-lg object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
