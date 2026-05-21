import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin, SHOP_IMAGE_BUCKET } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "画像ファイルを選択してください。" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `shops/${randomUUID()}.${extension}`;
    const supabase = createSupabaseAdmin();
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(SHOP_IMAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(SHOP_IMAGE_BUCKET).getPublicUrl(path);

    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "画像アップロードに失敗しました。") },
      { status: 500 },
    );
  }
}
