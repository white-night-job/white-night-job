import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
  LISTING_APPLICATION_IMAGE_BUCKET,
} from "@/lib/supabase";

const DOC_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const DOC_ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "pdf", "heic", "heif"]);

const IMAGE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const IMAGE_ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

const MAX_BYTES = 10 * 1024 * 1024;

const DOC_TYPE_TO_FOLDER: Record<string, string> = {
  "business-license": "business-license",
  "entertainment-license": "entertainment-license",
  "late-night-alcohol-notification": "late-night-alcohol-notification",
};

const IMAGE_TYPE_TO_KIND: Record<string, "exterior" | "interior"> = {
  "shop-exterior": "exterior",
  "shop-interior": "interior",
};

function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function detectDocExt(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (DOC_ALLOWED_EXT.has(ext)) return ext === "jpeg" ? "jpg" : ext;
  const mime = file.type.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  if (mime.includes("png")) return "png";
  return "jpg";
}

function detectImageExt(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_ALLOWED_EXT.has(ext)) {
    if (ext === "jpeg") return "jpg";
    if (ext === "heif") return "heic";
    return ext;
  }
  const mime = file.type.toLowerCase();
  if (mime.includes("webp")) return "webp";
  if (mime.includes("png")) return "png";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  return "jpg";
}

function isBucketNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message ?? "");
  const code = String((error as { code?: string }).code ?? "");
  return (
    /bucket not found/i.test(message) ||
    /bucket/i.test(message) ||
    /NoSuchBucket/i.test(code)
  );
}

export async function POST(request: Request) {
  let isImageUpload = false;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const draftId =
      String(formData.get("draftId") ?? "").trim() || randomUUID();
    const docType = String(formData.get("docType") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "ファイルを選択してください。" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "ファイルサイズは10MB以下にしてください。" },
        { status: 400 },
      );
    }

    const imageKind = IMAGE_TYPE_TO_KIND[docType];
    const docFolder = DOC_TYPE_TO_FOLDER[docType];

    if (!imageKind && !docFolder) {
      return NextResponse.json(
        { message: "不正なアップロード種別です。" },
        { status: 400 },
      );
    }

    const isImage = Boolean(imageKind);
    isImageUpload = isImage;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = (file.type || "").toLowerCase();

    if (isImage) {
      if (!IMAGE_ALLOWED_EXT.has(extension) && !IMAGE_ALLOWED_TYPES.has(mime)) {
        return NextResponse.json(
          {
            message:
              "店舗画像は JPEG / JPG / PNG / WEBP / HEIC のみアップロードできます。",
          },
          { status: 400 },
        );
      }
      if (extension === "pdf" || mime === "application/pdf") {
        return NextResponse.json(
          { message: "店舗画像にPDFは使用できません。" },
          { status: 400 },
        );
      }
    } else if (
      !DOC_ALLOWED_EXT.has(extension) &&
      !DOC_ALLOWED_TYPES.has(mime)
    ) {
      return NextResponse.json(
        { message: "対応形式は PDF / JPEG / JPG / PNG / HEIC です。" },
        { status: 400 },
      );
    }

    const safeExt = isImage ? detectImageExt(file) : detectDocExt(file);
    const safeName = sanitizeFileName(file.name).replace(/\.[^.]+$/, "");
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}.${safeExt}`;
    const folder = isImage ? imageKind! : docFolder!;
    const path = `draft/${draftId}/${folder}/${fileName}`;
    const bucket = isImage
      ? LISTING_APPLICATION_IMAGE_BUCKET
      : LISTING_APPLICATION_DOCUMENT_BUCKET;

    const supabase = createSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType =
      file.type ||
      (safeExt === "pdf" ? "application/pdf" : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`);

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error("[listing-applications/upload] failed:", error);
      throw error;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);

    if (signedError) {
      console.error(
        "[listing-applications/upload] signed url failed:",
        signedError,
      );
      throw signedError;
    }

    const uploadedAt = new Date().toISOString();
    const document = {
      storagePath: path,
      fileName: file.name,
      mimeType: contentType,
      size: file.size,
      uploadedAt,
      signedUrl: signed.signedUrl,
    };

    if (isImage) {
      const sortOrderRaw = Number(formData.get("sortOrder") ?? 0);
      const image = {
        ...document,
        kind: imageKind,
        sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0,
      };
      return NextResponse.json({
        ok: true,
        draftId,
        image,
        document,
      });
    }

    return NextResponse.json({
      ok: true,
      draftId,
      document,
    });
  } catch (error) {
    if (isImageUpload && isBucketNotFoundError(error)) {
      return NextResponse.json(
        {
          message:
            "画像の保存先が設定されていません。管理者へお問い合わせください。",
        },
        { status: 503 },
      );
    }
    if (isImageUpload) {
      return NextResponse.json(
        {
          message: "画像のアップロードに失敗しました。もう一度お試しください。",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "ファイルのアップロードに失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
