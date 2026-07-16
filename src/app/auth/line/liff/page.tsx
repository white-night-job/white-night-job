import { Suspense } from "react";
import LiffAuthClient from "./LiffAuthClient";

export default function LiffAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-center">
          <p className="text-sm leading-7 text-charcoal/80">
            ログインを完了しています…
          </p>
        </div>
      }
    >
      <LiffAuthClient />
    </Suspense>
  );
}
