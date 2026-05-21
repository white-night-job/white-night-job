export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
      maybeError.code ? `code: ${maybeError.code}` : undefined,
    ]
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    if (parts.length > 0) return parts.join(" / ");
  }

  return fallback;
}
