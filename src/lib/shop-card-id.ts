/** DOM id for listing/job cards (stable anchor for deep links / debugging). */
export function shopCardDomId(jobId: string, variant?: string) {
  const base = `shop-card-${jobId}`;
  return variant ? `${base}--${variant}` : base;
}
