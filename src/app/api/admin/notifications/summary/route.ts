import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { getAdminNotificationSummary } from "@/lib/admin-notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAdminNotificationSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "通知集計の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
