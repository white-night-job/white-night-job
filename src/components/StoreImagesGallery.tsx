"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";

type StoreImagesGalleryProps = {
  images: string[];
  shopName: string;
};

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function StoreImagesGallery({ images, shopName }: StoreImagesGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (images.length <= 1) return;
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? null : wrapIndex(current + 1, images.length),
        );
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null ? null : wrapIndex(current - 1, images.length),
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

  function stepLightbox(delta: number) {
    setLightboxIndex((current) =>
      current === null ? null : wrapIndex(current + delta, images.length),
    );
  }

  function handleLightboxTouchStart(event: TouchEvent) {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleLightboxTouchEnd(event: TouchEvent) {
    if (images.length <= 1) return;
    const touch = event.changedTouches[0];
    if (!touch || touchStartX.current == null || touchStartY.current == null) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    stepLightbox(dx < 0 ? 1 : -1);
  }

  return (
    <>
      <section className="rounded-3xl border border-gold/25 bg-gradient-to-br from-white to-ivory px-3 py-2.5 shadow-[0_8px_28px_rgba(201,169,98,0.12)] sm:px-4 sm:py-3">
        <h2 className="mb-1.5 flex items-center gap-2 font-serif text-lg font-semibold text-charcoal sm:mb-2 sm:text-xl">
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
              className="w-full shrink-0 snap-center"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group block w-full overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold transition hover:border-gold/50"
                aria-label={`${shopName}の店舗ギャラリー ${index + 1}を拡大表示`}
              >
                <span className="relative block h-[110px] w-full bg-zinc-100 sm:h-[120px]">
                  <Image
                    src={imageUrl}
                    alt={`${shopName}の店舗ギャラリー ${index + 1}`}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 720px"
                    className="object-cover object-center transition group-hover:scale-[1.01]"
                  />
                </span>
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div
            className="mt-1.5 flex items-center justify-center gap-1.5"
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
                  className={`h-1.5 rounded-full transition ${
                    active
                      ? "w-3.5 bg-gold-dark"
                      : "w-1.5 bg-gold/35 hover:bg-gold/55"
                  }`}
                />
              );
            })}
          </div>
        ) : null}
      </section>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4 pb-8 pt-16"
          role="dialog"
          aria-modal="true"
          aria-label="店舗ギャラリーの拡大表示"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex(null);
            }}
            className="fixed z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/70 text-white shadow-lg"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 16px)",
              right: "calc(env(safe-area-inset-right, 0px) + 16px)",
            }}
            aria-label="拡大表示を閉じる"
          >
            <span className="text-2xl font-light leading-none" aria-hidden>
              ×
            </span>
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(-1);
                }}
                className="absolute left-2 top-1/2 z-[85] -translate-y-1/2 rounded-full border border-white/35 bg-black/60 px-3.5 py-2.5 text-xl font-semibold leading-none text-white sm:left-5"
                aria-label="前の画像"
              >
                ＜
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepLightbox(1);
                }}
                className="absolute right-2 top-1/2 z-[85] -translate-y-1/2 rounded-full border border-white/35 bg-black/60 px-3.5 py-2.5 text-xl font-semibold leading-none text-white sm:right-5"
                aria-label="次の画像"
              >
                ＞
              </button>
            </>
          ) : null}

          <div
            className="relative h-[min(72vh,820px)] w-full max-w-5xl touch-pan-y"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <Image
              src={images[lightboxIndex]!}
              alt={`${shopName}の店舗ギャラリー ${lightboxIndex + 1}`}
              fill
              sizes="90vw"
              className="rounded-lg object-contain select-none"
              priority
              draggable={false}
            />
          </div>

          <p
            className="pointer-events-none absolute bottom-5 left-1/2 z-[85] -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white"
            style={{
              bottom:
                "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))",
            }}
          >
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
