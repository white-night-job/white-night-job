import { imageUploadFormatAndSizeHint } from "@/lib/image-upload-limits";

type ImageUploadSizeHintProps = {
  formats?: string;
  className?: string;
};

/** Unified per-file size hint for job and listing image upload fields. */
export function ImageUploadSizeHint({
  formats,
  className = "mt-1 text-xs leading-relaxed text-muted",
}: ImageUploadSizeHintProps) {
  return (
    <p className={className}>{imageUploadFormatAndSizeHint(formats ?? "JPG / PNG / WebP")}</p>
  );
}
