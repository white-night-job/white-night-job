import { Suspense } from "react";
import LiffLoginClient from "./LiffLoginClient";

export default function LiffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-center">
          <p className="text-sm leading-7 text-charcoal/80">
            LINEログインを準備しています…
          </p>
        </div>
      }
    >
      <LiffLoginClient />
    </Suspense>
  );
}
