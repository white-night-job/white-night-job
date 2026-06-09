import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  formatReportDateTime,
  getClientIp,
  sendReportEmail,
} from "@/lib/report-email";
import { createSupabaseAdmin } from "@/lib/supabase";

type ReportBody = {
  shopName?: string;
  area?: string;
  category?: string;
  detail?: string;
  contact?: string;
};

export async function POST(request: Request) {
  let dbSaved = false;

  try {
    const body = (await request.json()) as ReportBody;

    if (!body.shopName?.trim() || !body.category || !body.detail?.trim()) {
      return NextResponse.json(
        { message: "店舗名・報告種別・詳細内容を入力してください。" },
        { status: 400 },
      );
    }

    const shopName = body.shopName.trim();
    const area = body.area?.trim() || null;
    const category = body.category;
    const detail = body.detail.trim();
    const contact = body.contact?.trim() || null;
    const reportedAt = formatReportDateTime();
    const ip = getClientIp(request);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("reports").insert({
      shop_name: shopName,
      area,
      category,
      detail,
      contact,
    });

    if (error) {
      console.error("[reports] DB save failed:", error);
      throw error;
    }

    dbSaved = true;
    console.log("[reports] DB save succeeded:", { shopName, category });

    try {
      await sendReportEmail({
        shopName,
        category,
        area: area ?? undefined,
        detail,
        contact: contact ?? undefined,
        reportedAt,
        ip,
      });
      console.log("[reports] Email send succeeded:", { shopName });
    } catch (emailError) {
      console.error("[reports] Email send failed:", emailError);
      console.log("[reports] DB save succeeded before email failure:", {
        shopName,
        category,
      });
      return NextResponse.json(
        {
          message: getErrorMessage(
            emailError,
            "通知メールの送信に失敗しました。時間をおいて再度お試しください。",
          ),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (!dbSaved) {
      console.error("[reports] DB save failed:", error);
    }
    return NextResponse.json(
      { message: getErrorMessage(error, "通報の保存に失敗しました。") },
      { status: 500 },
    );
  }
}
