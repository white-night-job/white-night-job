import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      shopName?: string;
      area?: string;
      category?: string;
      detail?: string;
      contact?: string;
    };

    if (!body.shopName?.trim() || !body.category || !body.detail?.trim()) {
      return NextResponse.json(
        { message: "店舗名・報告種別・詳細内容を入力してください。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("reports").insert({
      shop_name: body.shopName.trim(),
      area: body.area?.trim() || null,
      category: body.category,
      detail: body.detail.trim(),
      contact: body.contact?.trim() || null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "通報の保存に失敗しました。") },
      { status: 500 },
    );
  }
}
