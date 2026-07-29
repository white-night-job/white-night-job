import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  rowToPublicStatus,
  type ListingApplicationRow,
} from "@/lib/listing-application";
import { createSupabaseAdmin } from "@/lib/supabase";

type StatusBody = {
  applicationNumber?: string;
  contactEmail?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StatusBody;
    const applicationNumber = body.applicationNumber?.trim();
    const contactEmail = body.contactEmail?.trim().toLowerCase();

    if (!applicationNumber || !contactEmail) {
      return NextResponse.json(
        { message: "申請番号とメールアドレスを入力してください。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("listing_applications")
      .select("*")
      .eq("application_number", applicationNumber)
      .eq("contact_email", contactEmail)
      .maybeSingle();

    if (error) {
      console.error("[listing-applications/status] lookup failed:", error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { message: "申請が見つかりません。申請番号とメールアドレスをご確認ください。" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: rowToPublicStatus(data as ListingApplicationRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, "審査状況の確認に失敗しました。"),
      },
      { status: 500 },
    );
  }
}
