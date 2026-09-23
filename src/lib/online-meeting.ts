/**
 * Pre-contract online meeting booking for shops considering a listing.
 * Set NEXT_PUBLIC_ONLINE_MEETING_BOOKING_URL to an https(s) calendar/booking URL
 * (e.g. Calendly). When unset or invalid, booking CTAs stay in a “準備中” state.
 */
export function getOnlineMeetingBookingUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_ONLINE_MEETING_BOOKING_URL?.trim() ?? "";
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
