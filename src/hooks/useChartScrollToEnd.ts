import { useEffect, useRef } from "react";

function scrollContainerToEnd(element: HTMLDivElement) {
  element.scrollLeft = element.scrollWidth - element.clientWidth;
}

export function useChartScrollToEnd(scrollKey: string) {
  const chartScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollKey) return;

    const scrollToEnd = () => {
      const element = chartScrollRef.current;
      if (!element) return;
      scrollContainerToEnd(element);
    };

    scrollToEnd();
    const frameId = window.requestAnimationFrame(scrollToEnd);
    const timeoutId = window.setTimeout(scrollToEnd, 100);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [scrollKey]);

  return chartScrollRef;
}
