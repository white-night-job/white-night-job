"use client";

import Image from "next/image";
import { IMAGE_ALT_BRAND } from "@/lib/site";

type JobHeroImageProps = {
  shopName: string;
  imageUrl?: string;
};

export function JobHeroImage({ shopName, imageUrl }: JobHeroImageProps) {
  const src = String(imageUrl ?? "").trim();

  if (!src) {
    return (
      <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-charcoal via-[#2b2418] to-gold-dark sm:h-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,213,163,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(201,169,98,0.22),transparent_35%)]" />
        <div className="relative text-center">
          <p className="font-serif text-2xl font-semibold tracking-wide text-gold-light">
            White Night Job
          </p>
          <p className="mt-2 text-xs tracking-[0.3em] text-gold-light/80">
            VERIFIED SHOP
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-t-2xl bg-zinc-100 sm:h-80">
      <Image
        src={src}
        alt={`${shopName}の求人｜${IMAGE_ALT_BRAND}`}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
      />
    </div>
  );
}
