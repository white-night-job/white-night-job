/**
 * Client-side image prep for listing application uploads.
 * Resizes long edge ~1600px and encodes as JPEG/WebP before upload.
 */

export type CompressImageResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  skipped: boolean;
};

const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.8;

function isHeicLike(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImageFile(file: File): boolean {
  if (isPdf(file)) return false;
  if (file.type.startsWith("image/")) return true;
  return isHeicLike(file);
}

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error("HEIC conversion failed");
  }
  return blob;
}

function loadImageBitmap(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source);
}

function loadHtmlImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

async function drawToCanvas(
  source: Blob,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  let width = 0;
  let height = 0;
  let drawable: CanvasImageSource | null = null;

  try {
    const bitmap = await loadImageBitmap(source);
    width = bitmap.width;
    height = bitmap.height;
    drawable = bitmap;
  } catch {
    const img = await loadHtmlImage(source);
    width = img.naturalWidth || img.width;
    height = img.naturalHeight || img.height;
    drawable = img;
  }

  if (!drawable || width <= 0 || height <= 0) {
    throw new Error("invalid image dimensions");
  }

  const longEdge = Math.max(width, height);
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  ctx.drawImage(drawable, 0, 0, targetW, targetH);

  if (typeof (drawable as ImageBitmap).close === "function") {
    try {
      (drawable as ImageBitmap).close();
    } catch {
      /* ignore */
    }
  }

  return { canvas, width: targetW, height: targetH };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("encode failed"));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function encodePreferWebp(canvas: HTMLCanvasElement): Promise<{
  blob: Blob;
  mime: string;
  ext: string;
}> {
  try {
    const webp = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    if (webp.type === "image/webp" && webp.size > 0) {
      return { blob: webp, mime: "image/webp", ext: "webp" };
    }
  } catch {
    /* fallback jpeg */
  }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  return { blob: jpeg, mime: "image/jpeg", ext: "jpg" };
}

async function encodeJpeg(canvas: HTMLCanvasElement): Promise<{
  blob: Blob;
  mime: string;
  ext: string;
}> {
  const jpeg = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  return { blob: jpeg, mime: "image/jpeg", ext: "jpg" };
}

export type CompressListingImageOptions = {
  /** Prefer WebP when supported. Force JPEG for document uploads (API has no webp). */
  preferWebp?: boolean;
};

/**
 * Compress/resize image for upload. PDFs and non-images are returned unchanged.
 */
export async function compressListingImage(
  file: File,
  options?: CompressListingImageOptions,
): Promise<CompressImageResult> {
  const preferWebp = options?.preferWebp !== false;
  const originalBytes = file.size;
  if (!isImageFile(file)) {
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      skipped: true,
    };
  }

  try {
    let source: Blob = file;
    let baseName = file.name;

    if (isHeicLike(file)) {
      source = await heicToJpegBlob(file);
      baseName = replaceExtension(file.name, "jpg");
    }

    const { canvas } = await drawToCanvas(source);
    const encoded = preferWebp
      ? await encodePreferWebp(canvas)
      : await encodeJpeg(canvas);
    const outName = replaceExtension(baseName, encoded.ext);

    // Keep original if compression made it larger (small icons etc.)
    if (encoded.blob.size >= originalBytes && !isHeicLike(file)) {
      return {
        file,
        originalBytes,
        compressedBytes: originalBytes,
        skipped: true,
      };
    }

    const out = new File([encoded.blob], outName, {
      type: encoded.mime,
      lastModified: Date.now(),
    });

    if (typeof console !== "undefined" && console.info) {
      console.info(
        "[listing-image-compress]",
        file.name,
        `${originalBytes} -> ${out.size} bytes`,
        `(${Math.round((out.size / Math.max(1, originalBytes)) * 100)}%)`,
      );
    }

    return {
      file: out,
      originalBytes,
      compressedBytes: out.size,
      skipped: false,
    };
  } catch (error) {
    console.warn("[listing-image-compress] fallback to original", error);
    return {
      file,
      originalBytes,
      compressedBytes: originalBytes,
      skipped: true,
    };
  }
}

export function fileFingerprint(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index], index);
      }
    },
  );
  await Promise.all(runners);
  return results;
}

export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.max(
        0,
        Math.min(99, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress(pct);
    };
    xhr.onload = () => {
      onProgress(100);
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {
            "Content-Type":
              xhr.getResponseHeader("Content-Type") || "application/json",
          },
        }),
      );
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.send(formData);
  });
}
