import type { ReactNode } from "react";

export function TopPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 sm:-mx-6">
      <div className="absolute inset-0 bg-luxury-page" aria-hidden />
      <div className="top-page-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {children}
      </div>
    </div>
  );
}
