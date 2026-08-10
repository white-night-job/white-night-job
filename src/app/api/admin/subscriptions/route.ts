import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { resolveBillingKeySafe, resolveBillingLabel } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { mapSubscriptionRow } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, jobs:store_id (shop_name)")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const items = rows.map((row) => {
      const mapped = mapSubscriptionRow(row as never);
      const job = row.jobs as { shop_name?: string } | null | undefined;
      return {
        ...mapped,
        shopName: mapped.storeId
          ? (job?.shop_name ?? null)
          : null,
        billingKey: resolveBillingKeySafe(mapped.stripePriceId),
        billingLabel: resolveBillingLabel(mapped.stripePriceId),
      };
    });

    return NextResponse.json({ subscriptions: items });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "契約一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
