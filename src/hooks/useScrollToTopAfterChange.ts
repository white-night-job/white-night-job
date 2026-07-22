"use client";

import { useCallback, useEffect, useRef } from "react";

/** Scroll to the top after the browser paints the updated view. */
export function scrollPageToTopAfterPaint() {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  });
}

/**
 * Request a top scroll that runs after `deps` update (e.g. preview open/close).
 * Does nothing unless `requestScrollToTop()` was called first.
 */
export function useScrollToTopAfterChange(deps: unknown[]) {
  const pendingRef = useRef(false);

  const requestScrollToTop = useCallback(() => {
    pendingRef.current = true;
  }, []);

  useEffect(() => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    scrollPageToTopAfterPaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps explicitly
  }, deps);

  return requestScrollToTop;
}
