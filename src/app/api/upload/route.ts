import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin, SHOP_IMAGE_BUCKET } from "@/lib/supabase";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? "image.jpg";
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized || "image.jpg";
}

function validateImageFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type.toLowerCase();

  if (ALLOWED_EXTENSIONS.has(extension)) return null;
  if (ALLOWED_IMAGE_TYPES.has(mimeType)) return null;
  if (mimeType === "image/pjpeg" || mimeType === "image/x-png") return null;

  return "対応形式は JPG / PNG / WebP です。";
}

function buildStoragePath(
  uploadType: string,
  file: File,
  jobId: string | null,
): string {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ALLOWED_EXTENSIONS.has(extension) ? extension : "jpg";

  if (uploadType === "store-image") {
    const ownerId = jobId?.trim() || randomUUID();
    const safeName = sanitizeFileName(file.name).replace(/\.[^.]+$/, "");
    return `store-images/${ownerId}/${Date.now()}-${safeName}.${safeExtension}`;
  }

  return `shops/${randomUUID()}.${safeExtension}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const uploadType = String(formData.get("uploadType") ?? "shop");
  const jobId = String(formData.get("jobId") ?? "").trim() || null;

  const isAdmin = await isAdminAuthenticated();
  const shopJobId = await getAuthenticatedShopJobId();
  const canUploadAsShop =
    shopJobId &&
    uploadType === "store-image" &&
    jobId === shopJobId;

  if (!isAdmin && !canUploadAsShop) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "画像ファイルを選択してください。" },
        { status: 400 },
      );
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const path = buildStoragePath(uploadType, file, jobId);
    const supabase = createSupabaseAdmin();
    const buffer = await file.arrayBuffer();
    const contentType =
      file.type ||
      (path.endsWith(".png")
        ? "image/png"
        : path.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg");

    const { error } = await supabase.storage
      .from(SHOP_IMAGE_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(SHOP_IMAGE_BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl?.trim();

    if (!publicUrl) {
      return NextResponse.json(
        { message: "公開URLの取得に失敗しました。Storageバケットの設定を確認してください。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ imageUrl: publicUrl, publicUrl });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "画像アップロードに失敗しました。") },
      { status: 500 },
    );
  }
}
