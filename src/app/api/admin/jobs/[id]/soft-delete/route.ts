import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invalidateAdminCacheByPrefix } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";
import {
  buildSoftDeleteJobPatch,
  isJobSoftDeleted,
} from "@/lib/job-soft-delete";
import { invalidateShopScopedCache } from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * 管理者のみ: 求人（店舗）を論理削除する。
 * Stripe 契約・応募・閲覧・口コミ等は変更しない。
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
    if (isJobSoftDeleted(existing)) {
      return NextResponse.json(
        { message: "この店舗はすでに削除済みです。" },
        { status: 409 },
      );
    }

    const patch = buildSoftDeleteJobPatch(existing);
    let { data: updated, error: updateError } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id, shop_name, deleted_at, deleted_from_listing_status")
      .maybeSingle();

    // deleted_from_listing_status 未追加のDBでも削除できるようにする
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
        .is("deleted_at", null)
        .select("id, shop_name, deleted_at")
        .maybeSingle());
    }

    if (updateError) throw updateError;
    if (!updated) {
      return NextResponse.json(
        { message: "店舗の削除に失敗しました。再度お試しください。" },
        { status: 409 },
      );
    }

    invalidateAdminCacheByPrefix("admin:");
    invalidateShopScopedCache(id);
    revalidateTag(`job-detail:${id}`);

    return NextResponse.json({
      ok: true,
      message: "店舗を削除しました",
      jobId: updated.id,
      shopName: updated.shop_name,
      deletedAt: updated.deleted_at,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "店舗の削除に失敗しました。") },
      { status: 500 },
    );
  }
}
