import type { ReactNode } from "react";

type TopPageShellProps = {
  hero: ReactNode;
  children: ReactNode;
};

export function TopPageShell({ hero, children }: TopPageShellProps) {
  return (
    <div className="top-page-shell relative w-full">
      <div className="absolute inset-0 bg-luxury-page" aria-hidden />
      <div className="absolute inset-0 bg-luxury-page-glow" aria-hidden />
      <div className="relative">{hero}</div>
      <div className="top-page-content relative mx-auto max-w-5xl px-4 py-2 sm:px-6 sm:py-3">
        {children}
      </div>
    </div>
  );
}
