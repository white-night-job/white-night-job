export function parsePickupFromBody(
  body: Record<string, unknown>,
): { pickup_enabled?: boolean } {
  const value = body.pickup_enabled ?? body.pickupEnabled;
  if (value === undefined) return {};
  return { pickup_enabled: Boolean(value) };
}

export function pickupToRow(parsed: { pickup_enabled?: boolean }): {
  pickup_enabled?: boolean;
} {
  if (parsed.pickup_enabled === undefined) return {};
  return { pickup_enabled: parsed.pickup_enabled };
}
