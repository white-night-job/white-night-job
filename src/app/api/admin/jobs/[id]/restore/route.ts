import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invalidateAdminCacheByPrefix } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";
import {
  buildSoftRestoreJobPatch,
  isJobSoftDeleted,
} from "@/lib/job-soft-delete";
import { invalidateShopScopedCache } from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * 管理者のみ: 論理削除済み店舗を復元する。
 * 復元後は掲載停止のまま（自動公開しない）。Stripe 等は変更しない。
 */
export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: SESSION_EXPIRED_MESSAGE }, { status: 401 });
  }

  try {
    const { id: rawId } = await params;
    const id = String(rawId ?? "").trim();
    if (!id) {
      return NextResponse.json({ message: "店舗IDが不正です。" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: existing, error: loadError } = await supabase
      .from("jobs")
      .select("id, shop_name, deleted_at, listing_status, published")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;
    if (!existing) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }
    if (!isJobSoftDeleted(existing)) {
      return NextResponse.json(
        { message: "この店舗は削除済みではないため復元できません。" },
        { status: 409 },
      );
    }

    const patch = buildSoftRestoreJobPatch();
    let { data: updated, error: updateError } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", id)
      .not("deleted_at", "is", null)
      .select("id, shop_name, deleted_at, listing_status, published")
      .maybeSingle();

    if (
      updateError &&
      (updateError.code === "42703" ||
        updateError.code === "PGRST204" ||
        /deleted_from_listing_status/.test(updateError.message ?? ""))
    ) {
      const { deleted_from_listing_status: _ignored, ...legacyPatch } = patch;
      ({ data: updated, error: updateError } = await supabase
        .from("jobs")
        .update(legacyPatch)
        .eq("id", id)
        .not("deleted_at", "is", null)
        .select("id, shop_name, deleted_at, listing_status, published")
        .maybeSingle());
    }

    if (updateError) throw updateError;
    if (!updated) {
      return NextResponse.json(
        { message: "店舗の復元に失敗しました。再度お試しください。" },
        { status: 409 },
      );
    }

    invalidateAdminCacheByPrefix("admin:");
    invalidateShopScopedCache(id);
    revalidateTag(`job-detail:${id}`);

    return NextResponse.json({
      ok: true,
      message: "店舗を復元しました",
      jobId: updated.id,
      shopName: updated.shop_name,
      listingStatus: updated.listing_status,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "店舗の復元に失敗しました。") },
      { status: 500 },
    );
  }
}
