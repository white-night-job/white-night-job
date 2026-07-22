import { createSupabaseAdmin, SHOP_IMAGE_BUCKET } from "@/lib/supabase";

const TEMP_PREFIX = "temp/";
const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isTempStoragePath(path: string): boolean {
  return path.startsWith(TEMP_PREFIX);
}

/** Extract storage object path from a public Supabase storage URL, if any. */
export function extractStoragePathFromPublicUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const marker = `/storage/v1/object/public/${SHOP_IMAGE_BUCKET}/`;
  const index = trimmed.indexOf(marker);
  if (index >= 0) {
    return decodeURIComponent(trimmed.slice(index + marker.length).split("?")[0] ?? "");
  }

  // Relative path fallback
  if (trimmed.startsWith(TEMP_PREFIX) || trimmed.startsWith("top-images/") || trimmed.startsWith("store-images/") || trimmed.startsWith("recruiters/") || trimmed.startsWith("shops/")) {
    return trimmed;
  }

  return null;
}

export function isTempImageUrl(url: string): boolean {
  const path = extractStoragePathFromPublicUrl(url);
  return Boolean(path && isTempStoragePath(path));
}

function permanentPathFromTemp(
  tempPath: string,
  kind: "top-image" | "store-image" | "recruiter-image" | "shop",
): string {
  // temp/{kind}/{ownerId}/{file}
  const withoutTemp = tempPath.slice(TEMP_PREFIX.length);
  const parts = withoutTemp.split("/");
  const fileName = parts[parts.length - 1] || `image-${Date.now()}.jpg`;
  const ownerId = parts[1] || parts[0] || "unknown";

  if (kind === "store-image") return `store-images/${ownerId}/${fileName}`;
  if (kind === "recruiter-image") return `recruiters/${ownerId}/${fileName}`;
  if (kind === "top-image") return `top-images/${ownerId}/${fileName}`;
  return `shops/${fileName}`;
}

function inferKindFromTempPath(
  tempPath: string,
): "top-image" | "store-image" | "recruiter-image" | "shop" {
  // temp/{kind}/...
  const kind = tempPath.slice(TEMP_PREFIX.length).split("/")[0];
  if (
    kind === "store-image" ||
    kind === "top-image" ||
    kind === "recruiter-image" ||
    kind === "shop"
  ) {
    return kind;
  }
  return "shop";
}

/**
 * Copy a temp object to a permanent path and return the new public URL.
 * Non-temp URLs are returned unchanged.
 */
export async function promoteTempImageUrl(url: string): Promise<string> {
  const path = extractStoragePathFromPublicUrl(url);
  if (!path || !isTempStoragePath(path)) return url;

  const supabase = createSupabaseAdmin();
  const kind = inferKindFromTempPath(path);
  const destPath = permanentPathFromTemp(path, kind);

  const { error: copyError } = await supabase.storage
    .from(SHOP_IMAGE_BUCKET)
    .copy(path, destPath);

  if (copyError) {
    // If destination already exists, reuse it
    const { data: existing } = supabase.storage
      .from(SHOP_IMAGE_BUCKET)
      .getPublicUrl(destPath);
    if (existing.publicUrl) return existing.publicUrl;
    throw copyError;
  }

  const { data } = supabase.storage.from(SHOP_IMAGE_BUCKET).getPublicUrl(destPath);
  return data.publicUrl?.trim() || url;
}

export async function promoteTempImageUrls(urls: string[]): Promise<string[]> {
  const result: string[] = [];
  for (const url of urls) {
    result.push(await promoteTempImageUrl(url));
  }
  return result;
}

export async function cleanupExpiredTempImages(now = Date.now()): Promise<{
  scanned: number;
  deleted: number;
}> {
  const supabase = createSupabaseAdmin();
  let scanned = 0;
  let deleted = 0;

  async function walk(prefix: string) {
    const { data, error } = await supabase.storage.from(SHOP_IMAGE_BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data) return;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      const isFolder = !item.id;
      if (isFolder) {
        await walk(fullPath);
        continue;
      }

      scanned += 1;
      const updatedAt = item.updated_at ? Date.parse(item.updated_at) : NaN;
      const createdAt = item.created_at ? Date.parse(item.created_at) : NaN;
      const stamp = Number.isFinite(updatedAt)
        ? updatedAt
        : Number.isFinite(createdAt)
          ? createdAt
          : 0;
      if (now - stamp < TEMP_MAX_AGE_MS) continue;

      const { error: removeError } = await supabase.storage
        .from(SHOP_IMAGE_BUCKET)
        .remove([fullPath]);
      if (!removeError) deleted += 1;
    }
  }

  await walk("temp");
  return { scanned, deleted };
}
