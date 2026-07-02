import type { ReactNode } from "react";

function LuxuryParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="luxury-particle left-[8%] top-[6%] h-24 w-24 opacity-40" />
      <span className="luxury-particle animation-delay-300 right-[12%] top-[14%] h-16 w-16 opacity-30" />
      <span className="luxury-particle animation-delay-600 left-[20%] top-[42%] h-20 w-20 opacity-25" />
      <span className="luxury-particle animation-delay-450 right-[6%] top-[55%] h-28 w-28 opacity-35" />
      <span className="sparkle left-[4%] top-[22%] text-xs">✦</span>
      <span className="sparkle animation-delay-150 right-[8%] top-[28%] text-sm">✧</span>
      <span className="sparkle animation-delay-300 left-[15%] bottom-[18%] text-[10px]">✦</span>
      <span className="sparkle animation-delay-600 right-[18%] bottom-[12%] text-xs">✧</span>
    </div>
  );
}

export function TopPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 sm:-mx-6">
      <div className="absolute inset-0 bg-luxury-page" aria-hidden />
      <LuxuryParticles />
      <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
    </div>
  );
}
