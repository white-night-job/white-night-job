/** Matches listing-applications/upload API and Supabase bucket file_size_limit (10485760). */
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_MAX_MB = 10;

export const JOB_IMAGE_UPLOAD_FORMATS = "JPG / PNG / WebP";
export const LISTING_IDENTITY_UPLOAD_FORMATS = "JPEG / PNG / PDF";

export function imageUploadPerFileLimitLabel(): string {
  return `1枚あたり最大${IMAGE_UPLOAD_MAX_MB}MB`;
}

export function imageUploadFormatAndSizeHint(formats: string): string {
  return `${formats}（${imageUploadPerFileLimitLabel()}）`;
}

export function validateUploadFileSize(
  file: File,
  options?: { label?: "image" | "file" },
): string | null {
  const label = options?.label ?? "image";
  const noun = label === "file" ? "ファイル" : "画像";

  if (file.size <= 0) {
    return `${noun}を選択してください。`;
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return `ファイルサイズが上限を超えています。${IMAGE_UPLOAD_MAX_MB}MB以下の${noun}を選択してください。`;
  }
  return null;
}

export function validateImageUploadFileSize(file: File): string | null {
  return validateUploadFileSize(file, { label: "image" });
}
