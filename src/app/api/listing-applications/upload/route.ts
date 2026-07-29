import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin, SHOP_IMAGE_BUCKET } from "@/lib/supabase";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES_HINT = 8;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const draftId = String(formData.get("draftId") ?? "").trim() || randomUUID();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "ファイルを選択してください。" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "ファイルサイズは5MB以下にしてください。" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = file.type.toLowerCase();
    if (!ALLOWED_EXT.has(extension) && !ALLOWED_TYPES.has(mime)) {
      return NextResponse.json(
        { message: "対応形式は JPG / PNG / WebP / PDF です。" },
        { status: 400 },
      );
    }

    const safeExt = ALLOWED_EXT.has(extension)
      ? extension
      : mime.includes("pdf")
        ? "pdf"
        : "jpg";
    const path = `listing-applications/${draftId}/${Date.now()}-${randomUUID().slice(0, 8)}.${safeExt}`;

    const supabase = createSupabaseAdmin();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(SHOP_IMAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || `application/${safeExt}`,
        upsert: false,
      });

    if (error) {
      console.error("[listing-applications/upload] failed:", error);
      throw error;
    }

    const { data: publicData } = supabase.storage
      .from(SHOP_IMAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      attachment: {
        url: publicData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type || safeExt,
      },
      draftId,
      maxFiles: MAX_FILES_HINT,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, "ファイルのアップロードに失敗しました。"),
      },
      { status: 500 },
    );
  }
}
