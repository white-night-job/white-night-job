import type { ReactNode } from "react";

export function TopPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="top-page-shell relative w-full max-w-full -mx-4 max-sm:mx-0 sm:-mx-6">
      <div className="absolute inset-0 bg-luxury-page" aria-hidden />
      <div className="absolute inset-0 bg-luxury-page-glow" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-2 sm:px-6 sm:py-3">
        {children}
      </div>
    </div>
  );
}
