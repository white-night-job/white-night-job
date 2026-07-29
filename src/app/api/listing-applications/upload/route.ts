import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  createSupabaseAdmin,
  LISTING_APPLICATION_DOCUMENT_BUCKET,
} from "@/lib/supabase";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "pdf", "heic", "heif"]);
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES_HINT = 8;

const DOC_TYPE_TO_FOLDER: Record<string, string> = {
  "business-license": "business-license",
  "entertainment-license": "entertainment-license",
  "late-night-alcohol-notification": "late-night-alcohol-notification",
  "general-attachment": "general-attachment",
};

function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function detectExt(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ALLOWED_EXT.has(ext)) return ext;
  const mime = file.type.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  if (mime.includes("png")) return "png";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const draftId = String(formData.get("draftId") ?? "").trim() || randomUUID();
    const docType = String(formData.get("docType") ?? "general-attachment").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "ファイルを選択してください。" }, { status: 400 });
    }

    const folder = DOC_TYPE_TO_FOLDER[docType];
    if (!folder) {
      return NextResponse.json({ message: "不正な書類種別です。" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "ファイルサイズは10MB以下にしてください。" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = file.type.toLowerCase();
    if (!ALLOWED_EXT.has(extension) && !ALLOWED_TYPES.has(mime)) {
      return NextResponse.json(
        { message: "対応形式は PDF / JPEG / JPG / PNG / HEIC です。" },
        { status: 400 },
      );
    }

    const safeExt = detectExt(file);
    const safeName = sanitizeFileName(file.name).replace(/\.[^.]+$/, "");
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}.${safeExt}`;
    const path = `draft/${draftId}/${folder}/${fileName}`;

    const supabase = createSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(LISTING_APPLICATION_DOCUMENT_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || `application/${safeExt}`,
        upsert: false,
      });

    if (error) {
      console.error("[listing-applications/upload] failed:", error);
      throw error;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(LISTING_APPLICATION_DOCUMENT_BUCKET)
      .createSignedUrl(path, 60 * 60);

    if (signedError) {
      console.error("[listing-applications/upload] signed url failed:", signedError);
      throw signedError;
    }

    const uploadedAt = new Date().toISOString();
    const document = {
      storagePath: path,
      fileName: file.name,
      mimeType: file.type || `application/${safeExt}`,
      size: file.size,
      uploadedAt,
      signedUrl: signed.signedUrl,
    };

    return NextResponse.json({
      ok: true,
      draftId,
      maxFiles: MAX_FILES_HINT,
      document,
      // backward-compatible field for existing optional 添付資料UI
      attachment: {
        url: signed.signedUrl,
        name: file.name,
        size: file.size,
        type: file.type || safeExt,
        storagePath: path,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ファイルのアップロードに失敗しました。") },
      { status: 500 },
    );
  }
}
