import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  listStripeCheckoutLinks,
  updateStripeCheckoutLink,
} from "@/lib/stripe-checkout-links";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const links = await listStripeCheckoutLinks();
    return NextResponse.json({ links });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "決済リンク一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      billingKey?: string;
      checkoutUrl?: string;
    };
    if (!body.billingKey || typeof body.billingKey !== "string") {
      return NextResponse.json({ message: "billingKey が必要です。" }, { status: 400 });
    }
    if (typeof body.checkoutUrl !== "string") {
      return NextResponse.json({ message: "checkoutUrl が必要です。" }, { status: 400 });
    }

    const link = await updateStripeCheckoutLink(body.billingKey, body.checkoutUrl);
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "決済リンクの更新に失敗しました。") },
      { status: 500 },
    );
  }
}
